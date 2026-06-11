const Task = require('../models/Task')
const AppError = require('../utils/AppError')

const createTask = async (req, res, next) => {
    const { title, description, status, priority, dueDate, assignedTo } = req.body

    const task = await Task.create({
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedTo: assignedTo ? parseInt(assignedTo) : null,
        createdBy: req.user.id
    })

    return res.status(201).json(task)
}

const getTask = async (req, res, next) => {
    const { id } = req.params

    const task = await Task.findById(id)

    if (!task) {
        return next(new AppError('Tarefa não encontrada', 404))
    }

    return res.status(200).json(task)
}

const listTasks = async (req, res, next) => {
    const { assignedTo, status, priority, dueBefore } = req.query

    const filters = {}

    if (assignedTo) filters.assignedTo = parseInt(assignedTo)
    if (status) filters.status = status
    if (priority) filters.priority = priority
    if (dueBefore) filters.dueDate = { lte: new Date(dueBefore) }
    // lte: less than or equal

    const tasks = await Task.findWithFilters(filters)

    return res.status(200).json(tasks)
}

const updateTask = async (req, res, next) => {
    const { id } = req.params

    const task = await Task.findById(id)
    if (!task) {
        return next(new AppError('Tarefa não encontrada', 404))
    }

    const { title, description, status, priority, dueDate, assignedTo } = req.body

    const updated = await Task.update(id, {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedTo: assignedTo ? parseInt(assignedTo) : undefined
    })

    return res.status(200).json(updated)
}

const deleteTask = async (req, res, next) => {
    const { id } = req.params

    const task = await Task.findById(id)
    if (!task) {
        return next(new AppError('Tarefa não encontrada', 404))
    }

    if (task.createdBy !== req.user.id && req.user.role !== 'admin') { // não é dono da tarefa e nem admin
        return next(new AppError('Acesso negado', 403))
    }

    await Task.remove(id)

    return res.status(204).send()
}

module.exports = { createTask, getTask, listTasks, updateTask, deleteTask }

