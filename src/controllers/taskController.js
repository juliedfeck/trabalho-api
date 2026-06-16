const Task = require('../models/Task')
const AppError = require('../utils/AppError')

const createTask = async (req, res, next) => {
    try {
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
    } catch (error) {
        next(error)
    }
}

const getTask = async (req, res, next) => {
    try {
        const { id } = req.params

        const task = await Task.findById(id)

        if (!task) {
            return next(new AppError('Tarefa não encontrada', 404))
        }

        return res.status(200).json(task)
    } catch (error) {
        next(error)
    }
}

const listTasks = async (req, res, next) => {
    try {
        const { assignedTo, status, priority, dueBefore } = req.query

        const filters = {}

        if (assignedTo) filters.assignedTo = parseInt(assignedTo)
        if (status) filters.status = status
        if (priority) filters.priority = priority
        if (dueBefore) filters.dueDate = { lte: new Date(dueBefore) }

        const tasks = await Task.findWithFilters(filters)

        return res.status(200).json(tasks)
    } catch (error) {
        next(error)
    }
}

const updateTask = async (req, res, next) => {
    try {
        const { id } = req.params

        const task = await Task.findById(id)
        if (!task) {
            return next(new AppError('Tarefa não encontrada', 404))
        }

        if (task.createdBy !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('Acesso negado', 403))
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
    } catch (error) {
        next(error)
    }
}

const deleteTask = async (req, res, next) => {
    try {
        const { id } = req.params

        const task = await Task.findById(id)
        if (!task) {
            return next(new AppError('Tarefa não encontrada', 404))
        }

        if (task.createdBy !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('Acesso negado', 403))
        }

        await Task.remove(id)

        return res.status(204).send()
    } catch (error) {
        next(error)
    }
}

module.exports = { createTask, getTask, listTasks, updateTask, deleteTask }
