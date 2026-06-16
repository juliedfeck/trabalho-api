const validateCreateTask = (req, res, next) => {
    const { title, status, priority } = req.body

    if (!title || title.trim() === '') {
        return res.status(400).json({ erro: "O campo 'title' é obrigatório." })
    }

    const statusValidos = ['pending', 'in_progress', 'done']
    if (status && !statusValidos.includes(status)) {
        return res.status(400).json({ erro: "Status inválido. Use: pending, in_progress ou done." })
    }

    const priorityValidos = ['low', 'medium', 'high']
    if (priority && !priorityValidos.includes(priority)) {
        return res.status(400).json({ erro: "Priority inválida. Use: low, medium ou high." })
    }

    next()
}

module.exports = { validateCreateTask }
