from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import numpy as np
import tensorflow as tf
from PIL import Image
import io
import os
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from openai import OpenAI

app = Flask(__name__)
CORS(app)

# Load AI Model
model = tf.keras.models.load_model("plant_disease_final_model.h5")

class_names = [
    "Apple Scab",
    "Corn Leaf Blight",
    "Grape Black Rot",
    "Healthy"
]

remedies = {
    "Apple Scab": {
        "en": "Apply fungicides like captan or sulfur.",
        "hi": "कैप्टन जैसे फफूंदनाशक का उपयोग करें।",
        "te": "క్యాప్టాన్ వంటి ఫంగిసైడ్ వాడండి."
    },
    "Corn Leaf Blight": {
        "en": "Use resistant hybrids and crop rotation.",
        "hi": "प्रतिरोधी किस्मों का उपयोग करें।",
        "te": "ప్రతిరోధక రకాలను వాడండి."
    },
    "Grape Black Rot": {
        "en": "Prune infected areas and apply fungicide.",
        "hi": "संक्रमित भागों को हटाएं।",
        "te": "సంక్రమిత భాగాలను తొలగించండి."
    },
    "Healthy": {
        "en": "Your plant is healthy.",
        "hi": "आपका पौधा स्वस्थ है।",
        "te": "మీ మొక్క ఆరోగ్యంగా ఉంది."
    }
}

last_prediction = {}

# Initialize OpenAI Client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    lang = request.form.get("language", "en")
    file = request.files["file"]

    image = Image.open(file).convert("RGB")
    image = image.resize((224, 224))
    image = np.array(image) / 255.0
    image = np.expand_dims(image, axis=0)

    prediction = model.predict(image)
    confidence = float(np.max(prediction))
    predicted_class = class_names[np.argmax(prediction)]

    remedy = remedies[predicted_class][lang]

    global last_prediction
    last_prediction = {
        "disease": predicted_class,
        "confidence": round(confidence * 100, 2),
        "remedy": remedy
    }

    return jsonify(last_prediction)

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert agriculture assistant helping farmers diagnose and treat crop diseases."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=200,
            temperature=0.7
        )

        answer = response.choices[0].message.content.strip()

    except Exception as e:
        answer = "AI service temporarily unavailable."

    return jsonify({"reply": answer})

@app.route("/download-report")
def download_report():
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer)
    elements = []

    styles = getSampleStyleSheet()

    elements.append(Paragraph("AgroDetect AI Report", styles["Title"]))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph(f"Disease: {last_prediction.get('disease')}", styles["Normal"]))
    elements.append(Paragraph(f"Confidence: {last_prediction.get('confidence')}%", styles["Normal"]))
    elements.append(Paragraph(f"Remedy: {last_prediction.get('remedy')}", styles["Normal"]))

    doc.build(elements)
    buffer.seek(0)

    return send_file(buffer, as_attachment=True, download_name="AgroDetect_Report.pdf")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)