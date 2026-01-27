import re
from bs4 import BeautifulSoup
from reportlab.lib.pagesizes import LETTER
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether
from reportlab.lib.enums import TA_LEFT
from pathlib import Path


def clean_text(text):
    """Cleans up whitespace and newlines from extracted text."""
    if not text:
        return ""
    # Replace multiple spaces/newlines with single space
    return re.sub(r'\s+', ' ', text).strip()

def parse_html_to_data(html_file_path):
    """Parses the HTML file and extracts questions and answers."""
    questions_data = []
    
    with open(html_file_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')

    # Find all question containers. 
    # Based on the file provided, questions have a prompt with id="question-prompt"
    # We find the prompt, then look for the answer section nearby.
    prompt_divs = soup.find_all(id="question-prompt")

    for i, prompt_div in enumerate(prompt_divs, 1):
        question_text = ""
        # Extract text from paragraphs inside the prompt div
        for p in prompt_div.find_all(['p', 'div', 'span']):
            if p.get_text(strip=True):
                question_text += p.get_text(strip=True) + " "
        
        question_text = clean_text(question_text)
        
        # Navigate to find answers. 
        # The prompt is usually inside a header wrapper. We need to find the specific container 
        # for answers which follows the header.
        # We assume the answer container is a sibling or cousin node.
        # A reliable way based on the snippet is to look for the next div containing data-purpose="answer"
        
        answers_data = []
        
        # We look for the main container of this specific question to scope our search for answers
        # The prompt is usually nested deep. We traverse up to find the 'question-result-pane'
        question_container = prompt_div.find_parent(class_=re.compile("result-pane--question-result-pane--"))
        
        if question_container:
            # Find all answer divs inside this specific question container
            answer_divs = question_container.find_all(attrs={"data-purpose": "answer"})
            
            for ans_div in answer_divs:
                # Get answer text
                ans_text_div = ans_div.find(id="answer-text")
                if ans_text_div:
                    ans_text = clean_text(ans_text_div.get_text())
                else:
                    ans_text = "Image/Unknown Content"

                # Check if this answer is correct
                # The class list contains 'answer-correct' for correct answers
                # e.g., class="answer-result-pane--answer-correct--PLOEU"
                classes = ans_div.get("class", [])
                is_correct = any("answer-correct" in c for c in classes)
                
                answers_data.append({
                    "text": ans_text,
                    "is_correct": is_correct
                })

        questions_data.append({
            "number": i,
            "question": question_text,
            "answers": answers_data
        })
        
    return questions_data

def create_pdf(questions_data, output_filename):
    """Generates a PDF from the extracted data."""
    output_path = Path(output_filename)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(output_path), pagesize=LETTER)
    styles = getSampleStyleSheet()
    story = []

    # Custom Styles
    style_question = ParagraphStyle(
        'Question',
        parent=styles['Heading3'],
        fontSize=12,
        spaceAfter=10,
        textColor=colors.black,
        leading=14
    )
    
    style_answer = ParagraphStyle(
        'Answer',
        parent=styles['BodyText'],
        fontSize=10,
        leftIndent=20,
        spaceAfter=5,
        leading=12
    )
    
    style_correct = ParagraphStyle(
        'CorrectAnswer',
        parent=styles['BodyText'],
        fontSize=10,
        leftIndent=20,
        spaceAfter=5,
        textColor=colors.green,
        fontName='Helvetica-Bold',
        leading=12
    )

    story.append(Paragraph("Exam Questions Export", styles['Title']))
    story.append(Spacer(1, 20))

    for q in questions_data:
        # Group question and answers to keep them together on one page if possible
        q_elements = []
        
        # Add Question Text
        q_text = f"<b>Q{q['number']}:</b> {q['question']}"
        q_elements.append(Paragraph(q_text, style_question))
        
        # Add Answers
        if q['answers']:
            for ans in q['answers']:
                prefix = "[CORRECT] " if ans['is_correct'] else "[ ] "
                style = style_correct if ans['is_correct'] else style_answer
                # Escape generic XML characters if necessary, though reportlab handles basics
                text = prefix + ans['text']
                # clean xml characters just in case
                text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                q_elements.append(Paragraph(text, style))
        else:
            q_elements.append(Paragraph("<i>(No answers found for this question)</i>", style_answer))
            
        q_elements.append(Spacer(1, 15))
        story.append(KeepTogether(q_elements))

    doc.build(story)
    print(f"PDF created successfully: {output_path}")

if __name__ == "__main__":
    base = Path(__file__).resolve().parent
    for i in range(1, 8):
        input_html = base / "exams_txt_files" / f"exam{i}_html.txt"
        output_pdf = base / "exams_pdf_files" / f"Exam{i}_Questions.pdf"
        
        print("Parsing HTML...")
        data = parse_html_to_data(input_html)
        
        if not data:
            print("No questions found. Please check the HTML file content or format.")
        else:
            print(f"Found {len(data)} questions. Generating PDF...")
            create_pdf(data, output_pdf)