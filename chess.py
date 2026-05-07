"""
Reinforcement Learning for Chess
=================================
A Deep Q-Learning (DQN) agent that learns to play chess via self-play.

Architecture:
- State: 8x8x12 tensor (one plane per piece type/color) + extra features
- Action: Selected from current legal moves (move-indexed Q-values)
- Network: Simple MLP that scores (state, move) pairs
- Algorithm: DQN with experience replay and target network
- Training: Self-play with epsilon-greedy exploration

Note: Full chess RL (AlphaZero-style) requires huge compute. This is a
runnable, educational implementation that demonstrates the core ideas
and will measurably improve over training, though it won't reach
master-level play without scaling up significantly.
"""

import random
import math
from collections import deque
from dataclasses import dataclass

import numpy as np
import chess
import torch
import torch.nn as nn
import torch.optim as optim


# -----------------------------------------------------------------------------
# State encoding
# -----------------------------------------------------------------------------

# Piece -> plane index. White pieces 0-5, black pieces 6-11.
PIECE_TO_PLANE = {
    (chess.PAWN, chess.WHITE): 0,
    (chess.KNIGHT, chess.WHITE): 1,
    (chess.BISHOP, chess.WHITE): 2,
    (chess.ROOK, chess.WHITE): 3,
    (chess.QUEEN, chess.WHITE): 4,
    (chess.KING, chess.WHITE): 5,
    (chess.PAWN, chess.BLACK): 6,
    (chess.KNIGHT, chess.BLACK): 7,
    (chess.BISHOP, chess.BLACK): 8,
    (chess.ROOK, chess.BLACK): 9,
    (chess.QUEEN, chess.BLACK): 10,
    (chess.KING, chess.BLACK): 11,
}

PIECE_VALUES = {
    chess.PAWN: 1.0,
    chess.KNIGHT: 3.0,
    chess.BISHOP: 3.0,
    chess.ROOK: 5.0,
    chess.QUEEN: 9.0,
    chess.KING: 0.0,  # Captured via checkmate, not material
}


def board_to_tensor(board: chess.Board) -> np.ndarray:
    """Encode a board position as a flat feature vector.

    Returns a vector of length 8*8*12 + 5 = 773 features:
        - 12 piece planes (8x8 each)
        - 4 castling rights
        - 1 side-to-move flag
    """
    planes = np.zeros((12, 8, 8), dtype=np.float32)
    for square, piece in board.piece_map().items():
        plane = PIECE_TO_PLANE[(piece.piece_type, piece.color)]
        rank = chess.square_rank(square)
        file = chess.square_file(square)
        planes[plane, rank, file] = 1.0

    extras = np.array([
        float(board.has_kingside_castling_rights(chess.WHITE)),
        float(board.has_queenside_castling_rights(chess.WHITE)),
        float(board.has_kingside_castling_rights(chess.BLACK)),
        float(board.has_queenside_castling_rights(chess.BLACK)),
        float(board.turn == chess.WHITE),
    ], dtype=np.float32)

    return np.concatenate([planes.flatten(), extras])


def move_to_features(board: chess.Board, move: chess.Move) -> np.ndarray:
    """Encode a move as a feature vector (relative to the current board).

    Features (length 12):
        - from-square one-hot file (8) ... compressed via numeric file/rank
        - to-square file/rank
        - moving piece type (one-hot, 6)
        - is_capture, is_promotion, is_castling, gives_check
    """
    from_sq, to_sq = move.from_square, move.to_square
    piece = board.piece_at(from_sq)
    piece_type = piece.piece_type if piece else 0

    piece_onehot = np.zeros(6, dtype=np.float32)
    if piece_type:
        piece_onehot[piece_type - 1] = 1.0

    features = np.array([
        chess.square_file(from_sq) / 7.0,
        chess.square_rank(from_sq) / 7.0,
        chess.square_file(to_sq) / 7.0,
        chess.square_rank(to_sq) / 7.0,
        float(board.is_capture(move)),
        float(move.promotion is not None),
        float(board.is_castling(move)),
    ], dtype=np.float32)

    return np.concatenate([features, piece_onehot])


STATE_SIZE = 12 * 8 * 8 + 5  # 773
MOVE_FEATURE_SIZE = 7 + 6     # 13
INPUT_SIZE = STATE_SIZE + MOVE_FEATURE_SIZE


# -----------------------------------------------------------------------------
# Q-Network
# -----------------------------------------------------------------------------

class QNetwork(nn.Module):
    """Estimates Q(s, a) given (state, move) features."""

    def __init__(self, input_size: int = INPUT_SIZE, hidden: int = 256):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_size, hidden),
            nn.ReLU(),
            nn.Linear(hidden, hidden),
            nn.ReLU(),
            nn.Linear(hidden, hidden // 2),
            nn.ReLU(),
            nn.Linear(hidden // 2, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x).squeeze(-1)


# -----------------------------------------------------------------------------
# Replay buffer
# -----------------------------------------------------------------------------

@dataclass
class Transition:
    state_move: np.ndarray          # state+move features at time t
    reward: float
    next_state_moves: np.ndarray    # all (state, move) features for s_{t+1}; shape [n_legal, INPUT_SIZE]
    done: bool


class ReplayBuffer:
    def __init__(self, capacity: int = 50_000):
        self.buffer: deque = deque(maxlen=capacity)

    def push(self, transition: Transition) -> None:
        self.buffer.append(transition)

    def sample(self, batch_size: int) -> list[Transition]:
        return random.sample(self.buffer, batch_size)

    def __len__(self) -> int:
        return len(self.buffer)


# -----------------------------------------------------------------------------
# Reward shaping
# -----------------------------------------------------------------------------

def material_balance(board: chess.Board, color: bool) -> float:
    """Material score from the perspective of `color`."""
    score = 0.0
    for piece_type, value in PIECE_VALUES.items():
        score += value * len(board.pieces(piece_type, color))
        score -= value * len(board.pieces(piece_type, not color))
    return score


def step_reward(prev_board: chess.Board, new_board: chess.Board, mover_color: bool) -> tuple[float, bool]:
    """Compute reward for `mover_color` after they made a move.

    Returns (reward, done).
    """
    if new_board.is_checkmate():
        # The player who just moved wins (the side-to-move on new_board has no moves).
        return 1.0, True
    if new_board.is_stalemate() or new_board.is_insufficient_material() \
            or new_board.is_seventyfive_moves() or new_board.is_fivefold_repetition():
        return 0.0, True

    # Shaped reward: change in material from mover's perspective.
    prev_mat = material_balance(prev_board, mover_color)
    new_mat = material_balance(new_board, mover_color)
    shaping = (new_mat - prev_mat) * 0.05  # small coefficient so terminal reward dominates

    return shaping, False


# -----------------------------------------------------------------------------
# Agent
# -----------------------------------------------------------------------------

class DQNAgent:
    def __init__(self, lr: float = 1e-4, gamma: float = 0.99,
                 epsilon_start: float = 1.0, epsilon_end: float = 0.05,
                 epsilon_decay_steps: int = 20_000, device: str = "cpu"):
        self.device = torch.device(device)
        self.policy_net = QNetwork().to(self.device)
        self.target_net = QNetwork().to(self.device)
        self.target_net.load_state_dict(self.policy_net.state_dict())
        self.target_net.eval()

        self.optimizer = optim.Adam(self.policy_net.parameters(), lr=lr)
        self.gamma = gamma

        self.epsilon_start = epsilon_start
        self.epsilon_end = epsilon_end
        self.epsilon_decay_steps = epsilon_decay_steps
        self.steps_done = 0

    @property
    def epsilon(self) -> float:
        frac = min(1.0, self.steps_done / self.epsilon_decay_steps)
        return self.epsilon_start + (self.epsilon_end - self.epsilon_start) * frac

    def encode_legal_moves(self, board: chess.Board) -> tuple[list[chess.Move], np.ndarray]:
        """Return legal moves and the (state+move) feature matrix."""
        state_vec = board_to_tensor(board)
        legal = list(board.legal_moves)
        if not legal:
            return [], np.zeros((0, INPUT_SIZE), dtype=np.float32)

        feats = np.zeros((len(legal), INPUT_SIZE), dtype=np.float32)
        for i, mv in enumerate(legal):
            feats[i, :STATE_SIZE] = state_vec
            feats[i, STATE_SIZE:] = move_to_features(board, mv)
        return legal, feats

    @torch.no_grad()
    def select_move(self, board: chess.Board, greedy: bool = False) -> tuple[chess.Move, np.ndarray]:
        legal, feats = self.encode_legal_moves(board)
        if not legal:
            raise ValueError("No legal moves available.")

        if not greedy and random.random() < self.epsilon:
            idx = random.randrange(len(legal))
        else:
            x = torch.from_numpy(feats).to(self.device)
            q_values = self.policy_net(x)
            idx = int(torch.argmax(q_values).item())

        return legal[idx], feats[idx]

    def train_step(self, batch: list[Transition], batch_size: int) -> float:
        # Current Q(s, a)
        state_moves = torch.from_numpy(
            np.stack([t.state_move for t in batch])
        ).to(self.device)
        rewards = torch.tensor([t.reward for t in batch], dtype=torch.float32, device=self.device)
        dones = torch.tensor([t.done for t in batch], dtype=torch.float32, device=self.device)

        q_pred = self.policy_net(state_moves)

        # Target: r + gamma * max_a' Q_target(s', a')
        # Note: opponent moves between s and s'. We treat opponent as part of env,
        # so we want max from OUR perspective at s'. Since reward is from mover's
        # perspective and turns alternate, we negate the next-state max.
        with torch.no_grad():
            next_max = torch.zeros(batch_size, device=self.device)
            for i, t in enumerate(batch):
                if t.done or t.next_state_moves.shape[0] == 0:
                    continue
                nx = torch.from_numpy(t.next_state_moves).to(self.device)
                # Opponent picks max for themselves -> bad for us -> negate
                next_max[i] = -self.target_net(nx).max()

        target = rewards + self.gamma * next_max * (1.0 - dones)
        loss = nn.functional.smooth_l1_loss(q_pred, target)

        self.optimizer.zero_grad()
        loss.backward()
        nn.utils.clip_grad_norm_(self.policy_net.parameters(), 1.0)
        self.optimizer.step()

        return float(loss.item())

    def sync_target(self) -> None:
        self.target_net.load_state_dict(self.policy_net.state_dict())


# -----------------------------------------------------------------------------
# Training loop (self-play)
# -----------------------------------------------------------------------------

def play_self_play_game(agent: DQNAgent, buffer: ReplayBuffer, max_plies: int = 200) -> dict:
    """Play one self-play game; store transitions; return stats."""
    board = chess.Board()
    # Per-color: previously stored (state_move features, mover_color)
    pending: dict[bool, np.ndarray | None] = {chess.WHITE: None, chess.BLACK: None}

    plies = 0
    result = None

    while not board.is_game_over(claim_draw=True) and plies < max_plies:
        mover = board.turn
        prev_board = board.copy(stack=False)

        try:
            move, sm_feat = agent.select_move(board)
        except ValueError:
            break

        board.push(move)
        agent.steps_done += 1
        plies += 1

        reward, done = step_reward(prev_board, board, mover)

        # Cache this move's transition; finalize it on the mover's NEXT turn,
        # when we know the resulting position they'll face.
        if pending[mover] is not None:
            # We had a prior pending transition for this mover. The "next state"
            # for that prior transition is the CURRENT board (mover's new turn).
            # But that prior was finalized already on the opponent's last move
            # below — so this branch is unused. Kept for clarity.
            pass

        # Finalize the OPPONENT's previous pending transition: their next state
        # is the position they now face (current board, mover-just-moved means
        # opponent will move next... wait, mover just moved, so it's now opponent's turn).
        opp = not mover
        if pending[opp] is not None:
            # Opponent's next state is `board` (it's their turn now), but reward
            # for opponent comes from THEIR last move, which we already recorded.
            # We update that transition's next_state_moves now.
            prev_sm, prev_reward = pending[opp]
            _, next_feats = agent.encode_legal_moves(board)
            buffer.push(Transition(
                state_move=prev_sm,
                reward=prev_reward,
                next_state_moves=next_feats,
                done=False,
            ))
            pending[opp] = None

        if done:
            # Terminal: store mover's transition with terminal reward.
            buffer.push(Transition(
                state_move=sm_feat,
                reward=reward,
                next_state_moves=np.zeros((0, INPUT_SIZE), dtype=np.float32),
                done=True,
            ))
            # Opponent loses (or draws): give them the negated terminal reward
            # tied to THEIR last move if one is pending.
            if pending[opp] is not None:
                prev_sm, _ = pending[opp]
                buffer.push(Transition(
                    state_move=prev_sm,
                    reward=-reward,
                    next_state_moves=np.zeros((0, INPUT_SIZE), dtype=np.float32),
                    done=True,
                ))
                pending[opp] = None
            result = board.result(claim_draw=True)
            break
        else:
            # Stash this move as pending; we'll finalize on the next turn.
            pending[mover] = (sm_feat, reward)

    if result is None:
        result = board.result(claim_draw=True) if board.is_game_over(claim_draw=True) else "*"

    return {"plies": plies, "result": result}


def train(
    episodes: int = 200,
    batch_size: int = 64,
    warmup: int = 500,
    target_sync_every: int = 1000,
    log_every: int = 10,
    device: str | None = None,
) -> DQNAgent:
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Training on {device}")

    agent = DQNAgent(device=device)
    buffer = ReplayBuffer(capacity=50_000)

    results_log = {"1-0": 0, "0-1": 0, "1/2-1/2": 0, "*": 0}
    losses: list[float] = []

    for ep in range(1, episodes + 1):
        stats = play_self_play_game(agent, buffer)
        results_log[stats["result"]] = results_log.get(stats["result"], 0) + 1

        # Train a few steps per game
        if len(buffer) >= max(warmup, batch_size):
            for _ in range(8):
                batch = buffer.sample(batch_size)
                loss = agent.train_step(batch, batch_size)
                losses.append(loss)
                if agent.steps_done % target_sync_every == 0:
                    agent.sync_target()

        if ep % log_every == 0:
            recent_loss = np.mean(losses[-100:]) if losses else float("nan")
            print(
                f"Episode {ep:4d} | plies={stats['plies']:3d} | "
                f"result={stats['result']:>7s} | eps={agent.epsilon:.3f} | "
                f"buffer={len(buffer):5d} | avg_loss={recent_loss:.4f} | "
                f"W/D/L = {results_log['1-0']}/{results_log['1/2-1/2']}/{results_log['0-1']}"
            )

    return agent


# -----------------------------------------------------------------------------
# Evaluation: agent vs. random opponent
# -----------------------------------------------------------------------------

def evaluate_vs_random(agent: DQNAgent, games: int = 20) -> dict:
    """Play `games` games (alternating colors) against a random mover."""
    wins = draws = losses = 0
    for g in range(games):
        agent_color = chess.WHITE if g % 2 == 0 else chess.BLACK
        board = chess.Board()
        plies = 0
        while not board.is_game_over(claim_draw=True) and plies < 200:
            if board.turn == agent_color:
                move, _ = agent.select_move(board, greedy=True)
            else:
                move = random.choice(list(board.legal_moves))
            board.push(move)
            plies += 1

        result = board.result(claim_draw=True)
        if result == "1/2-1/2" or result == "*":
            draws += 1
        elif (result == "1-0" and agent_color == chess.WHITE) or \
             (result == "0-1" and agent_color == chess.BLACK):
            wins += 1
        else:
            losses += 1

    return {"wins": wins, "draws": draws, "losses": losses, "games": games}


# -----------------------------------------------------------------------------
# Demo
# -----------------------------------------------------------------------------

if __name__ == "__main__":
    random.seed(42)
    np.random.seed(42)
    torch.manual_seed(42)

    print("=" * 60)
    print("RL Chess - Deep Q-Learning via self-play")
    print("=" * 60)

    # Quick smoke-test training run. Bump `episodes` to 2000+ for real learning.
    agent = train(episodes=50, log_every=10)

    print("\n" + "=" * 60)
    print("Evaluating trained agent vs random opponent (20 games)...")
    print("=" * 60)
    stats = evaluate_vs_random(agent, games=20)
    print(f"Result: {stats['wins']}W / {stats['draws']}D / {stats['losses']}L "
          f"out of {stats['games']} games")
    win_rate = (stats['wins'] + 0.5 * stats['draws']) / stats['games']
    print(f"Score rate: {win_rate:.1%}")

    # Show one sample game
    print("\n" + "=" * 60)
    print("Sample game (trained agent as White vs random Black)")
    print("=" * 60)
    board = chess.Board()
    move_count = 0
    while not board.is_game_over(claim_draw=True) and move_count < 60:
        if board.turn == chess.WHITE:
            move, _ = agent.select_move(board, greedy=True)
        else:
            move = random.choice(list(board.legal_moves))
        board.push(move)
        move_count += 1
    print(board)
    print(f"\nResult: {board.result(claim_draw=True)} ({move_count} plies)")