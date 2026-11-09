
from PyPDF2 import PdfReader
from docx import Document
from PIL import Image
import pytesseract
import base64
import io
from ..constantes.constante import client

#pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Fonction pour extraire le texte des fichiers
def extract_text_from_file(file_path):
    """
    Extrait le texte à partir de fichiers PDF et Word.

    Args:
        file_path (str): Le chemin du fichier.

    Returns:
        str: Le texte extrait, ou None en cas d'erreur.
    """
    text = ""
    try:
        if file_path.lower().endswith(".pdf"):
            with open(file_path, "rb") as file:
                reader = PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text() or ""  # Gérer les pages vides
        elif file_path.path.lower().endswith((".doc", ".docx")):
            doc = Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        elif file_path.lower().endswith(".txt"):
            with open(file_path, "r", encoding="utf-8") as file:
                text = file.read()
        else:
            return None  # Type de fichier non supporté
    except Exception as e:
        print(f"Erreur lors de l'extraction du texte de {file_path}: {e}")
        return None
    return text


# Détection du type d'image : code / texte / design
def detect_image_type(text):
    code_keywords = ['def ', 'function', 'class ', '{', '}', 'return ', 'console.log', 'print(']
    if any(keyword in text for keyword in code_keywords):
        return 'code'
    elif len(text.strip()) < 20:
        return 'design'
    else:
        return 'text'


# Traitement de toutes les images
def handle_uploaded_images(images):
    results = []

    for image in images:
        img = Image.open(image)
        extracted_text = pytesseract.image_to_string(img)
        image_type = detect_image_type(extracted_text)

        if image_type == 'code':
            prompt = f"""
                Voici une image contenant du code extrait par OCR. Merci de détecter les erreurs ou de donner une explication détaillée de ce code :

                \"\"\"{extracted_text.strip()}\"\"\"
                """
        elif image_type == 'text':
            prompt = f"""
                Voici un texte extrait d'une image. Merci de le reformuler, résumer ou d'en faire une analyse pédagogique :

                \"\"\"{extracted_text.strip()}\"\"\"
                """
        else:  # design
            prompt = f"""
                Voici une image extraite d'un exercice de design UI. L'utilisateur souhaite un retour critique sur la qualité du design (lisibilité, structure, hiérarchie, couleurs, etc.).

                Le texte détecté dans l'image est :

                \"\"\"{extracted_text.strip()}\"\"\"

                Peux-tu donner une analyse précise, comme si tu faisais une revue UX d'une maquette Figma ?
                Réponds comme un expert UX/UI avec des suggestions concrètes.
                """

        if client:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            response_text = response.text
        else:
            response_text = "Service Gemini non disponible (clé API manquante)."

        results.append({
            "image_name": image.name,
            "image_type": image_type,
            "ocr_text": extracted_text.strip(),
            "response": response_text
        })

    return results

