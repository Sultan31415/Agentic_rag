# 🎓 AI Teaching Assistant Setup Guide

## Overview

Your Agentic RAG system has been configured as an **AI Teaching Assistant** to help students with:
- ✅ Course materials and textbook questions
- ✅ Algorithm and programming concept explanations
- ✅ Recent research and real-world applications
- ✅ Step-by-step problem-solving guidance

---

## 📚 Adding Course Materials

### Step 1: Prepare Your Educational Documents

Place your course materials in the `data/documents/` folder:

```bash
cd agentic-rag
mkdir -p data/documents
```

**Supported formats:**
- ✅ PDF files (.pdf) - Textbooks, lecture slides, research papers
- ✅ Text files (.txt) - Notes, transcripts, summaries

**Example structure:**
```
data/documents/
├── Introduction_to_Algorithms.pdf
├── Data_Structures_Textbook.pdf
├── Lecture_01_Introduction.pdf
├── Lecture_02_Sorting.pdf
├── Course_Syllabus.txt
├── Assignment_Guidelines.txt
└── Reference_Materials/
    ├── Python_Tutorial.pdf
    └── Algorithm_Complexity.pdf
```

### Step 2: Index the Documents

Run the document loader to create the vector database:

```bash
cd backend
python utils/document_loader.py
```

**What happens:**
1. Loads all PDF and TXT files from `data/documents/`
2. Splits documents into chunks (1000 chars, 200 overlap)
3. Generates embeddings using OpenAI (text-embedding-3-small)
4. Stores in FAISS vector database at `data/vector_store/`

**Output:**
```
Loading documents from data/documents...
Loaded 15 PDF files
Loaded 3 text files
Total documents loaded: 18

Splitting documents into chunks (size=1000, overlap=200)...
Created 432 document chunks

Creating vector store with embeddings...
Vector store created with 432 documents
Vector store saved to data/vector_store
```

### Step 3: Restart the Backend

```bash
cd backend
python main.py
```

The Teaching Assistant now has access to your course materials! 🎉

---

## 🎯 Customizing for Your Course

### Update Agent Prompts

Edit `backend/agents/supervisor_agent.py` to customize for your specific course:

```python
"=== AVAILABLE RESOURCES ===\n"
"1. local_knowledge_agent:\n"
"   - Use for: Computer Science 101, Data Structures, Algorithms\n"  # Your course
"   - Contains: Course textbook, lecture slides, assignments\n"     # Your materials
```

### Add Course-Specific Context

Update the system prompt with:
- Course name and code
- Professor information
- Assignment guidelines
- Prerequisites
- Grading criteria

Example:
```python
prompt=(
    "You are the AI Teaching Assistant for CS 301 - Data Structures & Algorithms.\n"
    "Professor: Dr. Smith\n"
    "Semester: Fall 2024\n\n"
    "Your role is to help students understand course concepts...\n"
)
```

---

## 💡 Teaching Features

### 1. Pedagogical Responses

The assistant is configured to:
- Start with clear, direct answers
- Explain the "why" not just the "what"
- Provide examples to illustrate concepts
- Break down complex topics
- Cite sources (textbook chapters, pages)
- Encourage critical thinking

### 2. Multi-Source Learning

Students get answers from:
- **Local Knowledge**: Your course materials (textbooks, slides)
- **Web Search**: Recent research, tutorials, real-world examples
- **Synthesis**: Combined insights from multiple sources

### 3. Example Questions Students Can Ask

**Conceptual Understanding:**
- "Explain how quicksort works"
- "What is the difference between BFS and DFS?"
- "Why is dynamic programming efficient?"

**Problem-Solving:**
- "How do I approach this sorting problem?"
- "What data structure should I use for..."
- "Can you walk me through this algorithm?"

**Current Applications:**
- "What are recent advances in machine learning?"
- "How is this algorithm used in real applications?"
- "What are the latest sorting algorithm optimizations?"

---

## 🔧 Configuration

### Environment Variables

Key settings in `.env`:

```env
# LLM Model (recommended for education)
LLM_MODEL=gemini-2.0-flash-exp  # Fast, accurate responses
LLM_TEMPERATURE=0.3             # Balanced creativity/accuracy

# Vector Search
TOP_K_RESULTS=3                 # Number of relevant chunks to retrieve
VECTOR_STORE_PATH=data/vector_store

# Embeddings
EMBEDDING_MODEL=text-embedding-3-small  # OpenAI embeddings
```

### Adjusting Response Style

**More formal/academic:**
```python
LLM_TEMPERATURE=0.1  # More deterministic
```

**More creative/exploratory:**
```python
LLM_TEMPERATURE=0.5  # More creative explanations
```

---

## 📊 Usage Tips for Students

### Best Practices

**✅ DO:**
- Ask specific questions about concepts
- Request step-by-step explanations
- Ask for examples and analogies
- Inquire about real-world applications
- Request clarification on difficult topics

**❌ DON'T:**
- Ask the assistant to do homework directly
- Expect code without understanding
- Skip learning the fundamentals
- Rely solely on the assistant (still attend lectures!)

### Example Student Workflow

1. **Review course material** → Lecture slides, textbook
2. **Ask clarifying questions** → "I don't understand recursion in quicksort"
3. **Get explanation** → Step-by-step breakdown with examples
4. **Explore further** → "What are real-world uses of quicksort?"
5. **Practice** → Apply understanding to problems

---

## 🚀 Advanced Features

### Adding Specific Course Documents

```bash
# Add individual files
cp ~/path/to/your-textbook.pdf data/documents/

# Re-index
cd backend
python utils/document_loader.py
```

### Organizing by Topic

```
data/documents/
├── 01_Introduction/
│   ├── Lecture_01.pdf
│   └── Reading_Chapter_1.pdf
├── 02_Sorting/
│   ├── Lecture_02.pdf
│   ├── Lecture_03.pdf
│   └── Sorting_Algorithms.pdf
├── 03_Data_Structures/
    └── ...
```

The system automatically indexes all subdirectories!

### Monitoring Student Queries

Check backend logs to see:
- What topics students ask about most
- Which agents are used
- Response times
- Potential gaps in materials

---

## 🎨 UI Customization

### Change Branding

Edit `frontend/src/App.jsx`:

```jsx
<h1>🎓 CS 301 Teaching Assistant</h1>  // Your course
<h2>👋 Hello, CS 301 Student!</h2>     // Custom greeting
```

### Update Example Questions

```jsx
<li>"Explain how merge sort works"</li>       // Course-specific
<li>"What is a binary search tree?"</li>      // Relevant topics
<li>"How do hash tables work in Python?"</li> // Language-specific
```

### Styling

Edit `frontend/src/App.css` to match your school colors:

```css
.chat-header {
  background: linear-gradient(135deg, #yourcolor1 0%, #yourcolor2 100%);
}
```

---

## 📈 Best Practices for Professors

### 1. Document Preparation

**Organize materials:**
- Clear file names (e.g., `Lecture_03_Sorting_Algorithms.pdf`)
- Include chapter/section numbers
- Add metadata in file properties

**Quality over quantity:**
- Use authoritative textbooks
- Include solved examples
- Add practice problems with solutions

### 2. Monitoring Usage

- Check which topics generate most questions
- Identify areas where students struggle
- Update materials based on query patterns

### 3. Academic Integrity

**Important Notes:**
- The assistant **explains concepts**, doesn't do homework
- Configure prompts to encourage learning, not shortcuts
- Monitor for appropriate usage
- Consider adding academic integrity guidelines to the system prompt

### 4. Continuous Improvement

- Regularly add new materials (papers, articles, examples)
- Update with current semester content
- Gather student feedback
- Refine agent prompts based on effectiveness

---

## 🔒 Privacy & Security

- **Local Processing**: Documents stay on your server
- **No Data Leakage**: OpenAI embeddings don't store content
- **Student Privacy**: Conversations can be isolated by session
- **Access Control**: Add authentication if needed

---

## 🛠️ Troubleshooting

### "No relevant information found"

**Causes:**
- Document not indexed
- Query too specific or too broad
- No matching content in materials

**Solutions:**
```bash
# Re-index documents
cd backend
python utils/document_loader.py

# Check vector store exists
ls -la data/vector_store/
```

### Poor quality answers

**Adjust settings:**
```env
TOP_K_RESULTS=5        # Retrieve more context
LLM_TEMPERATURE=0.2    # More focused responses
```

### Slow responses

- Use lighter LLM model: `gemini-2.0-flash-exp`
- Reduce `TOP_K_RESULTS`
- Optimize document chunking size

---

## 📞 Support

For issues:
1. Check backend logs: `backend` terminal output
2. Verify .env configuration
3. Test vector store: `python -c "from tools.vector_search import vector_search_manager; vector_search_manager.initialize()"`
4. Check API connectivity: `curl http://localhost:8000/api/v1/health`

---

## 🎓 Example Use Cases

### Computer Science Course
- **Materials**: Algorithm textbooks, coding examples, complexity analysis
- **Topics**: Data structures, algorithms, time complexity
- **Queries**: "Explain Big O notation", "How does a hash table work?"

### Mathematics Course
- **Materials**: Calculus textbook, problem sets, proofs
- **Topics**: Derivatives, integrals, theorems
- **Queries**: "Explain the chain rule", "How do I solve this integral?"

### Engineering Course
- **Materials**: Circuit diagrams, lab manuals, specifications
- **Topics**: Electrical circuits, signal processing
- **Queries**: "How do I analyze this circuit?", "What is Kirchhoff's law?"

---

## 🚀 Getting Started Checklist

- [ ] Place course materials in `data/documents/`
- [ ] Run document indexer: `python utils/document_loader.py`
- [ ] Customize agent prompts for your course
- [ ] Update frontend branding
- [ ] Test with sample student questions
- [ ] Share access link with students
- [ ] Monitor usage and iterate

---

## 📚 Resources

- **Documentation**: See `/README.md`, `/backend/README.md`, `/frontend/README.md`
- **API Docs**: http://localhost:8000/docs
- **LangGraph Guide**: https://langchain-ai.github.io/langgraph/

---

**Your AI Teaching Assistant is ready to help students learn! 🎉**

Questions? Check the main `README.md` or reach out for support.
