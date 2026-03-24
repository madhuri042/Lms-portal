const path = require('path');
const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const AcademicExam = require('../models/AcademicExam');
const { streamOpenRouterToSse } = require('../utils/openRouterStream');

const syllabiDir = path.join(__dirname, '..', '..', 'uploads', 'exam-syllabi');

// @desc    Add an academic exam (multipart: syllabus PDF required)
// @route   POST /api/academic-exams
// @access  Private
exports.addAcademicExam = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a syllabus PDF.' });
        }
        const { universityName, examName, examCode, examDate } = req.body;
        const u = (universityName || '').trim();
        const n = (examName || '').trim();
        const c = (examCode || '').trim();
        if (!u || !n || !c) {
            return res.status(400).json({
                success: false,
                message: 'University name, exam name, and exam code are required.',
            });
        }

        const exam = await AcademicExam.create({
            user: req.user.id,
            universityName: u,
            examName: n,
            examCode: c,
            examDate: examDate ? new Date(examDate) : null,
            syllabusFileName: req.file.filename,
            syllabusOriginalName: req.file.originalname,
        });
        res.status(201).json({ success: true, data: exam });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all academic exams for the current user (delete exams whose date has passed)
// @route   GET /api/academic-exams
// @access  Private
exports.getAcademicExams = async (req, res) => {
    try {
        const userId = req.user.id;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Delete exams whose exam date has passed (date completed)
        await AcademicExam.deleteMany({
            user: userId,
            examDate: { $ne: null, $lt: startOfToday },
        });

        const exams = await AcademicExam.find({ user: userId }).sort({ createdAt: -1 });
        const data = exams.map((doc) => {
            const o = doc.toObject ? doc.toObject() : { ...doc };
            const hasSyllabus = Boolean(doc.syllabusFileName || o.syllabusFileName);
            delete o.syllabusFileName;
            delete o.syllabusOriginalName;
            return { ...o, hasSyllabus };
        });
        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete an academic exam
// @route   DELETE /api/academic-exams/:id
// @access  Private
exports.deleteAcademicExam = async (req, res) => {
    try {
        const exam = await AcademicExam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }
        if (exam.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (exam.syllabusFileName) {
            const fp = path.join(syllabiDir, exam.syllabusFileName);
            fs.unlink(fp, () => {});
        }
        await exam.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Stream AI study plan from syllabus PDF (same SSE format as /api/chat)
// @route   POST /api/academic-exams/prep-stream/:id
// @access  Private
exports.streamExamPrep = async (req, res) => {
    try {
        const exam = await AcademicExam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }
        if (exam.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (!exam.syllabusFileName) {
            return res.status(400).json({
                success: false,
                message: 'This exam has no syllabus PDF. Create a new exam and attach a PDF.',
            });
        }

        const filePath = path.join(syllabiDir, exam.syllabusFileName);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Syllabus file is missing on the server.' });
        }

        const buffer = fs.readFileSync(filePath);
        let text = '';
        const parser = new PDFParse({ data: buffer });
        try {
            const result = await parser.getText();
            text = (result.text || '').trim();
        } catch {
            return res.status(400).json({
                success: false,
                message:
                    'Could not read the PDF. Use a text-based (searchable) PDF; scanned image-only PDFs may not work.',
            });
        } finally {
            await parser.destroy().catch(() => {});
        }

        if (!text || text.length < 40) {
            return res.status(400).json({
                success: false,
                message:
                    'Very little text was found in the PDF. Try a searchable PDF, or ask the AI Tutor manually with pasted topics.',
            });
        }

        const cap = 100000;
        if (text.length > cap) {
            text = `${text.slice(0, cap)}\n\n[...syllabus truncated for length...]`;
        }

        const dateStr = exam.examDate
            ? new Date(exam.examDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
              })
            : 'Not specified';

        const systemPrompt = `You are an expert study coach for university students. You analyze syllabi and suggest efficient exam preparation.
Be practical: list topics, ordering, and priorities. Use clear headings and bullet points. If the syllabus is vague, say so and suggest general strategies.
Do not invent specific course content that is not supported by the syllabus text.`;

        const userMessage = `The student is preparing for this exam:
- University: ${exam.universityName}
- Exam name: ${exam.examName}
- Exam code: ${exam.examCode}
- Exam date: ${dateStr}
- Syllabus file: ${exam.syllabusOriginalName || 'syllabus.pdf'}

Below is text extracted from their syllabus PDF. Based ONLY on this material, tell them what to learn and in what order. Include:
1) Major topics or units to master
2) Suggested study order
3) What to skim vs study in depth
4) If the exam date is set, a simple countdown or week plan; otherwise a phased plan without specific dates.

--- SYLLABUS TEXT ---
${text}`;

        await streamOpenRouterToSse(res, { systemPrompt, userMessage });
    } catch (error) {
        console.error('streamExamPrep:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
