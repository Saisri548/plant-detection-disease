const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Sample disease data
const diseaseData = {
  English: [
    {d:"Powdery Mildew",s:"White powder on leaves.",t:"Spray fungicide.",p:"Avoid overhead watering."},
    {d:"Leaf Spot",s:"Brown or black spots.",t:"Use copper fungicide.",p:"Remove infected leaves."},
    {d:"Rust Disease",s:"Orange rust spots.",t:"Sulfur fungicide.",p:"Improve air flow."},
    {d:"Bacterial Blight",s:"Water soaked lesions.",t:"Antibacterial spray.",p:"Avoid wet leaves."},
    {d:"Early Blight",s:"Dark concentric rings.",t:"Neem oil or fungicide.",p:"Crop rotation."},
    {d:"Healthy Leaf",s:"No disease signs.",t:"No treatment needed.",p:"Maintain proper care."}
  ],
  Hindi: [
    {d:"पाउडरी मिल्ड्यू",s:"सफेद पाउडर जैसे धब्बे।",t:"फंगिसाइड छिड़कें।",p:"ऊपर से पानी न डालें।"},
    {d:"लीफ स्पॉट",s:"भूरे/काले धब्बे।",t:"कॉपर फंगिसाइड।",p:"संक्रमित पत्ते हटाएं।"},
    {d:"रस्ट रोग",s:"नारंगी जंग जैसे धब्बे।",t:"सल्फर फंगिसाइड।",p:"हवा का संचार बढ़ाएं।"},
    {d:"स्वस्थ पत्ता",s:"कोई रोग नहीं।",t:"उपचार आवश्यक नहीं।",p:"नियमित देखभाल।"}
  ],
  Telugu: [
    {d:"పౌడరీ మిల్డ్యూ",s:"తెల్లటి పొడి మచ్చలు.",t:"ఫంగిసైడ్ వాడండి.",p:"పై నుండి నీరు పోయవద్దు."},
    {d:"లీఫ్ స్పాట్",s:"గోధుమ/నల్ల మచ్చలు.",t:"కాపర్ ఫంగిసైడ్.",p:"బాధిత ఆకులు తొలగించండి."},
    {d:"రస్ట్ వ్యాధి",s:"నారింజ రంగు మచ్చలు.",t:"సల్ఫర్ ఫంగిసైడ్.",p:"గాలి ప్రవాహం పెంచండి."},
    {d:"ఆరోగ్యమైన ఆకు",s:"ఎటువంటి వ్యాధి లేదు.",t:"చికిత్స అవసరం లేదు.",p:"సరైన సంరక్షణ."}
  ]
};

// Upload endpoint
app.post("/detect", upload.single("leaf"), (req, res) => {
  const lang = req.body.language || "English";
  const fileName = req.file ? req.file.filename.toLowerCase() : "";

  const diseases = getDiseases(lang, fileName);

  res.json({ success: true, diseases });
});

// Logic to detect diseases (same as frontend)
function getDiseases(lang, fileName) {
  const list = diseaseData[lang] || diseaseData["English"];

  if(fileName.includes("healthy")) return [list[list.length-1]];
  if(fileName.includes("rust")) return list.filter(x=>x.d.toLowerCase().includes("rust"));
  return list;
}

// Create uploads folder if not exists
const fs = require("fs");
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// Start server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});