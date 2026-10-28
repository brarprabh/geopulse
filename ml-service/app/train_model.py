import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestRegressor

def generate_synthetic_data(samples=2000):
    np.random.seed(42)
    
    # 1. Distance between 0.5 km and 8.0 km
    distances = np.random.uniform(0.5, 8.0, samples)
    
    # 2. Hour of day (0 to 23)
    hours = np.random.randint(0, 24, samples)
    
    # 3. Traffic multiplier based on peak hours (lunch 12-14, dinner 19-22)
    traffic = []
    for h in hours:
        if 12 <= h <= 14 or 19 <= h <= 22:
            traffic.append(np.random.uniform(1.3, 1.8))  # Peak congestion
        else:
            traffic.append(np.random.uniform(1.0, 1.2))  # Off-peak
    traffic = np.array(traffic)
    
    # 4. Active orders already assigned to rider (0 to 3)
    active_orders = np.random.randint(0, 4, samples)
    
    # Target ETA calculation (realistic ground truth in minutes):
    # Base: 4 mins prep + (distance * 3.5 mins/km * traffic) + (active_orders * 5 mins) + noise
    eta = 4.0 + (distances * 3.5 * traffic) + (active_orders * 5.0) + np.random.normal(0, 1.0, samples)
    eta = np.maximum(eta, 5.0) # Minimum 5 mins
    
    # Feature matrix X: [distance, hour, traffic, active_orders]
    X = np.column_stack((distances, hours, traffic, active_orders))
    y = eta
    
    return X, y

def train_and_save():
    print("🧠 Generating synthetic fleet delivery training data...")
    X, y = generate_synthetic_data()
    
    print("⚙️ Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
    model.fit(X, y)
    
    # Save the trained model artifact to a .joblib or .pkl file
    output_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(output_dir, exist_ok=True)
    model_path = os.path.join(output_dir, "eta_model.joblib")
    
    joblib.dump(model, model_path)
    print(f"✅ Model successfully trained and saved to: {model_path}")

if __name__ == "__main__":
    train_and_save()