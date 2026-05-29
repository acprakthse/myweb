"""
Reinforcement Learning for BESS + PV Energy Management
=======================================================
A Deep Q-Learning (DQN) agent that learns to optimally dispatch a
Battery Energy Storage System (BESS) co-located with rooftop PV to
minimise electricity costs over a 24-hour horizon.

Architecture:
- State  : [sin(hour), cos(hour), SoC, pv_norm, load_norm, price_norm]  — 6 features
- Action : 5 discrete battery power levels  (full discharge → full charge)
- Network: MLP  state -> Q(s, a)  for all actions simultaneously
- Algorithm: DQN with experience replay and target network
- Episode: one simulated day (24 hourly steps)

Optimal strategy the agent discovers:
  • Night (cheap off-peak)   → charge battery from grid
  • Midday (high PV)         → store excess PV; avoid curtailment
  • Morning / evening peaks  → discharge battery to cut expensive grid imports
"""

import random
import math
from collections import deque
from dataclasses import dataclass
from typing import Optional, List, Tuple

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim


# ---------------------------------------------------------------------------
# Physical / market parameters
# ---------------------------------------------------------------------------

BATTERY_CAPACITY_KWH  = 10.0   # usable battery capacity [kWh]
BATTERY_MAX_POWER_KW  = 5.0    # max charge / discharge rate [kW]
BATTERY_EFFICIENCY    = 0.95   # one-way efficiency = sqrt(round-trip)
SOC_MIN, SOC_MAX      = 0.1, 0.9

PV_PEAK_KW    = 8.0    # nameplate PV capacity [kW]
SELL_PRICE_RATIO = 0.4 # feed-in tariff = 40 % of buy price

HOURS_PER_DAY = 24
DT            = 1.0    # time step [h]

# Discrete action space — fraction of max battery power
# negative = discharge (supply load), positive = charge (store energy)
ACTION_LEVELS: List[float] = [-1.0, -0.5, 0.0, 0.5, 1.0]
N_ACTIONS = len(ACTION_LEVELS)

STATE_SIZE = 6   # sin_h, cos_h, soc, pv_norm, load_norm, price_norm


# ---------------------------------------------------------------------------
# Synthetic profiles  (replace with real data as needed)
# ---------------------------------------------------------------------------

def pv_profile(hour: int) -> float:
    """Bell-curve PV generation peaking at solar noon [kW]."""
    if hour < 6 or hour > 20:
        return 0.0
    return PV_PEAK_KW * math.sin(math.pi * (hour - 6) / 14.0)


def load_profile(hour: int) -> float:
    """Typical residential demand with morning and evening peaks [kW]."""
    base = 1.5
    morning = 1.5 * math.exp(-0.5 * ((hour - 8) / 1.5) ** 2)
    evening = 2.5 * math.exp(-0.5 * ((hour - 19) / 2.0) ** 2)
    return base + morning + evening


def price_profile(hour: int) -> float:
    """Time-of-use buy price [$/kWh]: cheap at night, expensive at peaks."""
    if 7 <= hour <= 10 or 17 <= hour <= 21:
        return 0.25   # on-peak
    if hour >= 23 or hour <= 5:
        return 0.06   # off-peak
    return 0.12       # shoulder


# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

class BESSEnvironment:
    """
    Single-day BESS + PV dispatch environment.

    Power balance each hour:
        net_grid = load + batt_charge - pv
        net_grid > 0  ->  buying from grid  (cost)
        net_grid < 0  ->  selling to grid   (revenue at feed-in tariff)
    """

    def __init__(self, noise: bool = True):
        self.noise = noise
        self.hour = 0
        self.soc = 0.5

    def reset(self) -> np.ndarray:
        self.hour = 0
        self.soc = random.uniform(0.3, 0.7)
        return self._obs()

    # ------------------------------------------------------------------

    def _obs(self) -> np.ndarray:
        angle = 2.0 * math.pi * self.hour / HOURS_PER_DAY
        pv    = self._pv()
        load  = self._load()
        price = price_profile(self.hour)
        return np.array([
            math.sin(angle),
            math.cos(angle),
            self.soc,
            pv    / PV_PEAK_KW,
            load  / 5.0,
            price / 0.30,
        ], dtype=np.float32)

    def _pv(self) -> float:
        val = pv_profile(self.hour)
        if self.noise:
            val = max(0.0, val * (1.0 + random.gauss(0.0, 0.05)))
        return val

    def _load(self) -> float:
        val = load_profile(self.hour)
        if self.noise:
            val = max(0.3, val * (1.0 + random.gauss(0.0, 0.05)))
        return val

    # ------------------------------------------------------------------

    def step(self, action_idx: int) -> Tuple[np.ndarray, float, bool]:
        """Advance one hour. Returns (next_obs, reward, done)."""
        requested_kw = ACTION_LEVELS[action_idx] * BATTERY_MAX_POWER_KW
        pv    = self._pv()
        load  = self._load()
        price = price_profile(self.hour)

        # One-way efficiency: charging stores less, discharging delivers less
        eff = math.sqrt(BATTERY_EFFICIENCY)
        if requested_kw >= 0:          # charging
            delta_energy = requested_kw * DT * eff
        else:                          # discharging
            delta_energy = requested_kw * DT / eff

        # Clip to SoC limits and compute actual battery power
        new_soc = np.clip(self.soc + delta_energy / BATTERY_CAPACITY_KWH,
                          SOC_MIN, SOC_MAX)
        actual_delta = (new_soc - self.soc) * BATTERY_CAPACITY_KWH
        self.soc = float(new_soc)

        if requested_kw >= 0:
            actual_batt_kw = actual_delta / (DT * eff) if eff > 0 else 0.0
        else:
            actual_batt_kw = actual_delta * eff / DT

        # Net grid exchange [kW]  (positive = import, negative = export)
        net_grid_kw = load + actual_batt_kw - pv

        if net_grid_kw >= 0:
            grid_cost = net_grid_kw * price * DT
        else:
            # Selling surplus at feed-in tariff
            grid_cost = net_grid_kw * price * SELL_PRICE_RATIO * DT

        reward = -grid_cost  # agent maximises reward = minimises cost

        self.hour += 1
        done = (self.hour >= HOURS_PER_DAY)
        next_obs = self._obs() if not done else np.zeros(STATE_SIZE, dtype=np.float32)
        return next_obs, float(reward), done


# ---------------------------------------------------------------------------
# Q-Network
# ---------------------------------------------------------------------------

class QNetwork(nn.Module):
    """Maps state -> Q(s, a) for all N_ACTIONS simultaneously."""

    def __init__(self, state_size: int = STATE_SIZE,
                 n_actions: int = N_ACTIONS, hidden: int = 128):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_size, hidden),
            nn.ReLU(),
            nn.Linear(hidden, hidden),
            nn.ReLU(),
            nn.Linear(hidden, n_actions),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


# ---------------------------------------------------------------------------
# Replay buffer
# ---------------------------------------------------------------------------

@dataclass
class Transition:
    state:      np.ndarray
    action:     int
    reward:     float
    next_state: np.ndarray
    done:       bool


class ReplayBuffer:
    def __init__(self, capacity: int = 20_000):
        self.buffer: deque = deque(maxlen=capacity)

    def push(self, t: Transition) -> None:
        self.buffer.append(t)

    def sample(self, batch_size: int) -> List[Transition]:
        return random.sample(self.buffer, batch_size)

    def __len__(self) -> int:
        return len(self.buffer)


# ---------------------------------------------------------------------------
# DQN Agent
# ---------------------------------------------------------------------------

class DQNAgent:
    def __init__(self, lr: float = 1e-3, gamma: float = 0.97,
                 epsilon_start: float = 1.0, epsilon_end: float = 0.05,
                 epsilon_decay_steps: int = 5_000, device: str = "cpu"):
        self.device = torch.device(device)
        self.policy_net = QNetwork().to(self.device)
        self.target_net = QNetwork().to(self.device)
        self.target_net.load_state_dict(self.policy_net.state_dict())
        self.target_net.eval()

        self.optimizer = optim.Adam(self.policy_net.parameters(), lr=lr)
        self.gamma = gamma
        self.epsilon_start = epsilon_start
        self.epsilon_end   = epsilon_end
        self.epsilon_decay_steps = epsilon_decay_steps
        self.steps_done = 0

    @property
    def epsilon(self) -> float:
        frac = min(1.0, self.steps_done / self.epsilon_decay_steps)
        return self.epsilon_start + (self.epsilon_end - self.epsilon_start) * frac

    @torch.no_grad()
    def select_action(self, obs: np.ndarray, greedy: bool = False) -> int:
        self.steps_done += 1
        if not greedy and random.random() < self.epsilon:
            return random.randrange(N_ACTIONS)
        x = torch.from_numpy(obs).unsqueeze(0).to(self.device)
        q = self.policy_net(x)
        return int(q.argmax(dim=1).item())

    def train_step(self, batch: List[Transition]) -> float:
        states      = torch.tensor(np.stack([t.state      for t in batch]),
                                   dtype=torch.float32, device=self.device)
        actions     = torch.tensor([t.action  for t in batch],
                                   dtype=torch.long,    device=self.device)
        rewards     = torch.tensor([t.reward  for t in batch],
                                   dtype=torch.float32, device=self.device)
        next_states = torch.tensor(np.stack([t.next_state for t in batch]),
                                   dtype=torch.float32, device=self.device)
        dones       = torch.tensor([t.done    for t in batch],
                                   dtype=torch.float32, device=self.device)

        q_pred = self.policy_net(states).gather(1, actions.unsqueeze(1)).squeeze(1)

        with torch.no_grad():
            q_next = self.target_net(next_states).max(dim=1).values
            target = rewards + self.gamma * q_next * (1.0 - dones)

        loss = nn.functional.smooth_l1_loss(q_pred, target)
        self.optimizer.zero_grad()
        loss.backward()
        nn.utils.clip_grad_norm_(self.policy_net.parameters(), 1.0)
        self.optimizer.step()
        return float(loss.item())

    def sync_target(self) -> None:
        self.target_net.load_state_dict(self.policy_net.state_dict())


# ---------------------------------------------------------------------------
# Training loop
# ---------------------------------------------------------------------------

def run_episode(env: BESSEnvironment, agent: DQNAgent,
                buffer: ReplayBuffer, train: bool = True,
                batch_size: int = 64) -> Tuple[float, float]:
    """Run one 24-hour day. Returns (total_reward, avg_loss)."""
    obs = env.reset()
    total_reward = 0.0
    losses: List[float] = []

    for _ in range(HOURS_PER_DAY):
        action = agent.select_action(obs, greedy=not train)
        next_obs, reward, done = env.step(action)
        total_reward += reward

        if train:
            buffer.push(Transition(obs, action, reward, next_obs, done))
            if len(buffer) >= batch_size:
                batch = buffer.sample(batch_size)
                losses.append(agent.train_step(batch))

        obs = next_obs
        if done:
            break

    return total_reward, float(np.mean(losses)) if losses else 0.0


def train(
    episodes: int = 500,
    batch_size: int = 64,
    warmup_episodes: int = 20,
    target_sync_every: int = 50,
    log_every: int = 50,
    device: Optional[str] = None,
) -> DQNAgent:
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Training on {device}")

    env   = BESSEnvironment(noise=True)
    agent = DQNAgent(device=device)
    buffer = ReplayBuffer()

    reward_history: List[float] = []

    for ep in range(1, episodes + 1):
        do_train = ep > warmup_episodes
        total_r, avg_loss = run_episode(env, agent, buffer,
                                        train=do_train,
                                        batch_size=batch_size)
        reward_history.append(total_r)

        if do_train and ep % target_sync_every == 0:
            agent.sync_target()

        if ep % log_every == 0:
            recent = np.mean(reward_history[-log_every:])
            print(
                f"Episode {ep:4d} | reward={total_r:7.3f} | "
                f"avg_{log_every}={recent:7.3f} | "
                f"eps={agent.epsilon:.3f} | loss={avg_loss:.4f} | "
                f"buffer={len(buffer)}"
            )

    return agent


# ---------------------------------------------------------------------------
# Evaluation
# ---------------------------------------------------------------------------

def baseline_cost(noise: bool = False) -> float:
    """Cost when buying everything from grid (no battery, no PV)."""
    env = BESSEnvironment(noise=noise)
    env.reset()
    total = 0.0
    for h in range(HOURS_PER_DAY):
        env.hour = h
        load  = env._load()
        price = price_profile(h)
        total += load * price * DT
    return total


def evaluate(agent: DQNAgent, episodes: int = 20) -> dict:
    """Evaluate agent over multiple noiseless episodes."""
    env = BESSEnvironment(noise=False)
    rewards: List[float] = []
    for _ in range(episodes):
        total_r, _ = run_episode(env, agent, ReplayBuffer(), train=False)
        rewards.append(total_r)
    return {
        "mean_reward": float(np.mean(rewards)),
        "std_reward":  float(np.std(rewards)),
        "mean_cost":   float(-np.mean(rewards)),
    }


def show_day(agent: DQNAgent) -> None:
    """Print hour-by-hour dispatch for one noiseless day."""
    env = BESSEnvironment(noise=False)
    obs = env.reset()
    env.soc = 0.5  # fixed start

    print(f"\n{'Hour':>4} {'PV':>6} {'Load':>6} {'Price':>6} "
          f"{'Action':>12} {'SoC':>5} {'GridKW':>7} {'Cost$':>7}")
    print("-" * 65)

    total_cost = 0.0
    for h in range(HOURS_PER_DAY):
        pv    = pv_profile(h)
        load  = load_profile(h)
        price = price_profile(h)
        soc_before = env.soc

        action = agent.select_action(obs, greedy=True)
        obs, reward, _ = env.step(action)

        batt_kw = ACTION_LEVELS[action] * BATTERY_MAX_POWER_KW
        net_grid = load + batt_kw - pv
        cost = -reward
        total_cost += cost

        action_label = (
            f"chg {batt_kw:+.1f}kW" if batt_kw > 0.01 else
            f"dis {batt_kw:+.1f}kW" if batt_kw < -0.01 else
            "idle"
        )
        print(f"{h:>4} {pv:>6.2f} {load:>6.2f} {price:>6.3f} "
              f"{action_label:>12} {soc_before:>5.2f} {net_grid:>7.2f} {cost:>7.4f}")

    print("-" * 65)
    print(f"{'TOTAL':>60} {total_cost:>7.4f}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    random.seed(42)
    np.random.seed(42)
    torch.manual_seed(42)

    print("=" * 60)
    print("RL-BESS: Deep Q-Learning for BESS + PV dispatch")
    print("=" * 60)

    agent = train(episodes=500, log_every=50)

    print("\n" + "=" * 60)
    print("Evaluation (20 noiseless days)")
    print("=" * 60)
    stats = evaluate(agent, episodes=20)
    baseline = baseline_cost(noise=False)
    print(f"  Baseline cost (grid-only, no battery): ${baseline:.4f}/day")
    print(f"  Agent mean cost:                       ${stats['mean_cost']:.4f}/day")
    print(f"  Savings:                               "
          f"${baseline - stats['mean_cost']:.4f}/day "
          f"({(baseline - stats['mean_cost']) / baseline * 100:.1f} %)")

    print("\n" + "=" * 60)
    print("Hour-by-hour dispatch (trained agent, noiseless day)")
    print("=" * 60)
    show_day(agent)
