import PySAM.Pvsamv1 as pv
from database import Database
import pandas as pd
import math


def simulate_pv(
    weather_file,
    module_name="LONGi Green Energy Technology Co Ltd LR5-72HPH-550M",
    inverter_name="Fronius International GmbH: Fronius Primo 100-1 208-240 {240V}",
    tilt=10,
    azimuth=180,
    gcr=0.30,
    modules_per_string=10,
    n_strings=2,
    n_inverters=1,
    bifacial=False,
    soiling=3.0,
    dc_loss=2.0,
    ac_loss=1.0,
):
    """
    Run PV simulation using PySAM Pvsamv1.

    Returns
    -------
    df : pandas.DataFrame
        Hourly PV generation profile for MILP.

    data : dict
        PV system design and annual simulation results.
    """

    # ============================================================
    # DATABASE
    # ============================================================

    db = Database()

    module = db.get_module(module_name)
    inverter = db.get_inverter(inverter_name)

    # ============================================================
    # PYSAM
    # ============================================================

    sam = pv.default("FlatPlatePVCommercial")

    # ============================================================
    # WEATHER
    # ============================================================

    sam.SolarResource.solar_resource_file = weather_file

    # ============================================================
    # MODULE
    # ============================================================

    sam.Module.module_model = 1

    for name, value in module["pysam"].items():

        if hasattr(
            sam.CECPerformanceModelWithModuleDatabase,
            name
        ):

            try:
                setattr(
                    sam.CECPerformanceModelWithModuleDatabase,
                    name,
                    float(value)
                )

            except (ValueError, TypeError) as exc:
                raise ValueError(f"Invalid CEC parameter {name}: {value}") from exc

    # ============================================================
    # INVERTER
    # ============================================================

    sam.Inverter.inverter_model = 0

    INVERTER_NAME_ALIASES = {
        "inv_snl_mppt_low": "mppt_low_inverter",
        "inv_snl_mppt_hi": "mppt_hi_inverter",
    }

    for name, value in inverter["pysam"].items():

        pysam_name = INVERTER_NAME_ALIASES.get(
            name,
            name
        )

        target = (
            sam.Inverter
            if hasattr(sam.Inverter, pysam_name)
            else sam.InverterCECDatabase
        )

        if hasattr(target, pysam_name):

            try:
                setattr(
                    target,
                    pysam_name,
                    float(value)
                )

            except (ValueError, TypeError) as exc:
                raise ValueError(f"Invalid CEC parameter {name}: {value}") from exc

    # ============================================================
    # ARRAY
    # ============================================================

    sam.SystemDesign.subarray1_track_mode = 0
    sam.SystemDesign.subarray1_tilt = tilt
    sam.SystemDesign.subarray1_azimuth = azimuth
    sam.SystemDesign.subarray1_gcr = gcr

    # ============================================================
    # PHYSICAL DESIGN
    # ============================================================

    sam.SystemDesign.subarray1_modules_per_string = (
        modules_per_string
    )

    sam.SystemDesign.subarray1_nstrings = n_strings

    # ============================================================
    # DC CAPACITY
    # ============================================================

    # Nameplate capacity
    module_power_w = float(module["STC"])

    number_of_modules = (
        modules_per_string * n_strings
    )

    dc_capacity_kw = (
        number_of_modules *
        module_power_w /
        1000
    )

    sam.SystemDesign.system_capacity = dc_capacity_kw

    # ============================================================
    # AC CAPACITY
    # ============================================================

    inverter_power_w = float(
        inverter["Paco"]
    )

    inverter_power_kw = (
        inverter_power_w / 1000
    )

    sam.SystemDesign.inverter_count = n_inverters
    sam.Inverter.inverter_count = n_inverters

    ac_capacity_kw = (
        n_inverters *
        inverter_power_kw
    )

    dc_ac_ratio = (
        dc_capacity_kw /
        ac_capacity_kw
    )

    # ============================================================
    # BIFACIAL
    # ============================================================

    if bifacial:
        sam.CECPerformanceModelWithModuleDatabase.cec_is_bifacial = 1
    else:
        sam.CECPerformanceModelWithModuleDatabase.cec_is_bifacial = 0

    # ============================================================
    # LIFETIME
    # ============================================================

    sam.Lifetime.system_use_lifetime_output = 0
    sam.Lifetime.save_full_lifetime_variables = 0

    # ============================================================
    # RUN
    # ============================================================

    # One independent inverter group per roof face. Explicitly disable unused arrays.
    for i in (2, 3, 4):
        setattr(sam.SystemDesign, f"subarray{i}_enable", 0)
    sam.Inverter.inv_num_mppt = 1
    sam.SystemDesign.subarray1_tilt_eq_lat = 0
    sam.Shading.subarray1_shade_mode = 0
    sam.Losses.calculate_rack_shading = 0
    sam.Losses.subarray1_soiling = [soiling] * 12
    sam.Losses.subarray1_dcwiring_loss = dc_loss
    sam.Losses.acwiring_loss = ac_loss
    sam.AdjustmentFactors.adjust_constant = 0
    sam.execute()

    # ============================================================
    # OUTPUT
    # ============================================================

    annual_energy_kwh = float(
        sam.Outputs.annual_energy
    )

    capacity_factor_ac = float(
        sam.Outputs.capacity_factor_ac
    )

    capacity_factor_dc = float(
        sam.Outputs.capacity_factor
    )

    specific_yield = (
        annual_energy_kwh /
        dc_capacity_kw
    )

    # ============================================================
    # HOURLY GENERATION
    # ============================================================

    generation_kw = list(
        sam.Outputs.gen
    )

    # ============================================================
    # CREATE DATAFRAME
    # ============================================================

    df = pd.DataFrame({
        "hour": range(
            1,
            len(generation_kw) + 1
        ),

        "pv_power_kw": generation_kw
    })

    # PV output in MW
    df["pv_power_mw"] = (
        df["pv_power_kw"] / 1000
    )

    # PV output normalized to DC capacity
    #
    # Example:
    # 10 MWp system
    # generation = 5 MW
    #
    # pv_pu_dc = 0.5

    df["pv_pu_dc"] = (
        df["pv_power_kw"] /
        dc_capacity_kw
    )

    # PV output normalized to AC capacity

    df["pv_pu_ac"] = (
        df["pv_power_kw"] /
        ac_capacity_kw
    )

    # ============================================================
    # DATA FOR MILP / REPORTING
    # ============================================================

    data = {

        # --------------------------------------------------------
        # SYSTEM DESIGN
        # --------------------------------------------------------

        "module": module["Name"],
        "module_power_w": module_power_w,
        "number_of_modules": number_of_modules,

        "modules_per_string": modules_per_string,
        "number_of_strings": n_strings,

        "dc_capacity_kw": dc_capacity_kw,
        "dc_capacity_mw": dc_capacity_kw / 1000,

        "inverter": inverter["Name"],
        "inverter_power_kw": inverter_power_kw,

        "number_of_inverters": n_inverters,

        "ac_capacity_kw": ac_capacity_kw,
        "ac_capacity_mw": ac_capacity_kw / 1000,

        "dc_ac_ratio": dc_ac_ratio,

        # --------------------------------------------------------
        # CONFIGURATION
        # --------------------------------------------------------

        "tilt": tilt,
        "azimuth": azimuth,
        "gcr": gcr,

        "bifacial": bifacial,

        # --------------------------------------------------------
        # ANNUAL RESULTS
        # --------------------------------------------------------

        "annual_energy_kwh": annual_energy_kwh,

        "annual_energy_mwh": (
            annual_energy_kwh / 1000
        ),

        "annual_energy_gwh": (
            annual_energy_kwh / 1e6
        ),

        "capacity_factor_ac_percent":
            capacity_factor_ac,

        "capacity_factor_dc_percent":
            capacity_factor_dc,

        "specific_yield_kwh_per_kwp":
            specific_yield,

        # --------------------------------------------------------
        # HOURLY DATA
        # --------------------------------------------------------

        "n_timesteps": len(generation_kw),

        "timestep_hours": 1.0,
    }

    return df, data