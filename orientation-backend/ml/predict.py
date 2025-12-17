import warnings
warnings.filterwarnings("ignore")

from flask import Flask, request, jsonify
import joblib
import numpy as np
import os
import sys

# Initialize Flask App
app = Flask(__name__)

# Load Model Once
print("Loading model...")
try:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, "orientation_model.pkl")
    encoder_path = os.path.join(script_dir, "label_encoder.pkl")
    
    model = joblib.load(model_path)
    encoder = joblib.load(encoder_path)
    print("Model loaded successfully!")
except Exception as e:
    print(f"CRITICAL ERROR: Could not load model. {e}")
    sys.exit(1)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        # Expecting a list of features in the correct order
        # [math, physics, chemistry, biology, english, geography, selfStudy, absence]
        
        # Extract values in specific order ensuring they match the training columns
        # We assume the Java backend sends a list or a dict we translate.
        # Let's verify what we send from Java. 
        # Ideally, we should send a JSON object and map it here, OR send a raw list.
        # Let's decide to send a raw list 'features' from Java to keep it simple or map it.
        
        # Based on previous implementation, input was args.
        # Let's handle a JSON payload like {"features": [10, 11, ...]}
        
        if not data or 'features' not in data:
            return jsonify({"error": "No features provided"}), 400
            
        features = data['features']
        
        # Convert to numpy array
        X = np.array([features])
        
        # Predict
        pred = model.predict(X)
        result = encoder.inverse_transform(pred)[0]
        
        return jsonify({"prediction": result})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run on port 5000
    app.run(port=5000, debug=False)


