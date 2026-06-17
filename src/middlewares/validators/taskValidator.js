const statusValidos = ['pending', 'in_progress', 'done']
const priorityValidos = ['low', 'medium', 'high']

const validateCreateTask = (req, res, next) => {
    const { title, status, priority } = req.body

    if (!title || title.trim() === '') {
        return res.status(400).json({ message: "O campo 'title' é obrigatório." })
    }

    if (status && !statusValidos.includes(status)) {
        return res.status(400).json({ message: "Status inválido. Use: pending, in_progress ou done." })
    }

    if (priority && !priorityValidos.includes(priority)) {
        return res.status(400).json({ message: "Priority inválida. Use: low, medium ou high." })
    }

    next()
}

const validateUpdateTask = (req, res, next) => {
    const { title, status, priority } = req.body

    if (title !== undefined && title.trim() === '') {
        return res.status(400).json({ message: "O campo 'title' não pode ser vazio." })
    }

    if (status && !statusValidos.includes(status)) {
        return res.status(400).json({ message: "Status inválido. Use: pending, in_progress ou done." })
    }

    if (priority && !priorityValidos.includes(priority)) {
        return res.status(400).json({ message: "Priority inválida. Use: low, medium ou high." })
    }

    next()
}

module.exports = { validateCreateTask, validateUpdateTask }
