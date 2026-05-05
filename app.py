import streamlit as st
import pandas as pd
import plotly.graph_objects as go

# --- PAGE CONFIG ---
st.set_page_config(page_title="Coffee Blend Checker", page_icon="☕", layout="wide")

# --- CUSTOM CSS FOR MINIMALIST NAVY THEME ---
st.markdown("""
    <style>
    .main { background-color: #ffffff; }
    h1 { color: #001F3F; font-family: 'Helvetica Neue', sans-serif; }
    .stButton>button { background-color: #001F3F; color: white; border-radius: 5px; }
    .stMetric { border: 1px solid #f0f2f6; padding: 10px; border-radius: 10px; }
    </style>
    """, unsafe_allow_html=True)

# --- INITIALISE SESSION STATE FOR HISTORY ---
if 'history' not in st.session_state:
    st.session_state.history = []

# --- HEADER ---
st.title("Coffee Blend Checker")

# --- SIDEBAR: FINANCIAL INPUTS ---
with st.sidebar:
    st.header("Financial Settings")
    retail_price = st.number_input("Retail Price per 250g Bag (£)", value=4.50, step=0.10, help="The fixed shelf price in the UK market.")
    fx_rate = st.number_input("GBP/USD Exchange Rate", value=1.25, step=0.01, help="Manual rate used to convert global USD costs to GBP.")
    
    st.divider()
    
    arabica_usd_kg = st.number_input("Arabica Cost (USD/kg)", value=6.00, step=0.10)
    robusta_usd_kg = st.number_input("Robusta Cost (USD/kg)", value=3.50, step=0.10)
    
    st.divider()
    enable_carbon = st.checkbox("Enable Carbon Footprint Analysis")

# --- CALCULATIONS LOGIC ---
def calculate_metrics(robusta_pct):
    arabica_pct = 100 - robusta_pct
    # Costs per kg in GBP
    arabica_gbp_kg = arabica_usd_kg / fx_rate
    robusta_gbp_kg = robusta_usd_kg / fx_rate
    
    # Weighted cost for 250g (0.25kg)
    blend_cost_kg = (arabica_pct/100 * arabica_gbp_kg) + (robusta_pct/100 * robusta_gbp_kg)
    landed_cost_250g = blend_cost_kg * 0.25
    profit = retail_price - landed_cost_250g
    
    # Carbon logic (Arabica 1.2, Robusta 0.4 kg CO2e/kg)
    carbon_kg = (arabica_pct/100 * 1.2) + (robusta_pct/100 * 0.4)
    carbon_250g = carbon_kg * 0.25
    
    return round(landed_cost_250g, 2), round(profit, 2), round(carbon_250g, 3)

# --- MAIN PAGE: BLEND CONFIGURATION ---
col1, col2 = st.columns(2)

with col1:
    st.subheader("Original Blend")
    orig_robusta = st.number_input("Original Robusta %", 0, 100, 10)
    orig_cost, orig_profit, orig_carbon = calculate_metrics(orig_robusta)
    st.metric("Profit per Bag", f"£{orig_profit}")

with col2:
    st.subheader("Proposed Blend")
    prop_robusta = st.number_input("Proposed Robusta %", 0, 100, 30)
    prop_cost, prop_profit, prop_carbon = calculate_metrics(prop_robusta)
    
    profit_delta = round(prop_profit - orig_profit, 2)
    st.metric("Profit per Bag", f"£{prop_profit}", delta=f"£{profit_delta}")

# --- VISUAL: BEFORE VS AFTER CHART ---
st.divider()
fig = go.Figure(data=[
    go.Bar(name='Landed Cost', x=['Original', 'Proposed'], y=[orig_cost, prop_cost], marker_color='#b0bec5'),
    go.Bar(name='Gross Margin', x=['Original', 'Proposed'], y=[orig_profit, prop_profit], marker_color='#001F3F')
])
fig.update_layout(barmode='stack', title="Profit vs Cost per 250g Bag", height=400, plot_bgcolor='rgba(0,0,0,0)')
st.plotly_chart(fig, use_container_width=True)

# --- OPTIONAL CARBON MODULE ---
if enable_carbon:
    st.divider()
    st.subheader("Carbon Footprint (kg CO2e per bag)")
    c_col1, c_col2 = st.columns(2)
    
    carbon_delta = round(prop_carbon - orig_carbon, 3)
    
    with c_col1:
        st.metric("Original Carbon", f"{orig_carbon} kg")
    with c_col2:
        # delta_color="inverse" means DOWN is GREEN
        st.metric("Proposed Carbon", f"{prop_carbon} kg", delta=f"{carbon_delta} kg", delta_color="inverse")
    
    st.caption("Reference: Arabica (1.2kg CO2e/kg), Robusta (0.4kg CO2e/kg). Source: IDH Sustainable Trade (https://bit.ly)")

# --- SCENARIO TRACKER ---
st.divider()
if st.button("Save Scenario to Comparison Table"):
    scenario_data = {
        "Scenario": f"Scenario {len(st.session_state.history) + 1}",
        "Robusta %": prop_robusta,
        "FX Rate": fx_rate,
        "Profit (£)": prop_profit,
        "Carbon (kg)": prop_carbon if enable_carbon else "N/A"
    }
    st.session_state.history.append(scenario_data)
    st.toast('Scenario Saved Successfully!')

if st.session_state.history:
    st.subheader("Scenario History")
    df = pd.DataFrame(st.session_state.history)
    st.dataframe(df, use_container_width=True)
    
    csv = df.to_csv(index=False).encode('utf-8')
    st.download_button("Download Scenarios as CSV", data=csv, file_name="coffee_scenarios.csv", mime="text/csv")

# --- FOOTER ---
st.markdown("<br><hr><center>Coffee Blend Checker | Commercial Decision Support Tool for UK FMCG</center>", unsafe_allow_html=True)
