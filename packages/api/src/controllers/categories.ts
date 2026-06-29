import type { Request, Response } from 'express'
import * as categoryService from '../services/category.service.js'
import { handleError } from '../utils/handleError.js'
import { CategoryResource, CategoryCollection } from '../resources/index.js'
import { ErrorMessages, HttpStatus } from '../constants/index.js'

/**
 * GET /api/categories
 * List all available worker categories.
 */
export async function listCategories(_req: Request, res: Response) {
  try {
    const categories = await categoryService.listCategories()
    return res.json({ data: CategoryCollection(categories as any), status: 'success', code: 200 })
  } catch (err) {
    return handleError(res, err)
  }
}

/**
 * GET /api/categories/:id
 * Get a single category by id.
 */
export async function getCategory(req: Request, res: Response) {
  try {
    const category = await categoryService.getCategory(req.params.id as string)
    if (!category) {
      return res.status(HttpStatus.NOT_FOUND).json({ status: 'error', message: ErrorMessages.CATEGORY_NOT_FOUND, code: HttpStatus.NOT_FOUND })
    }
    return res.json({ data: CategoryResource(category as any), status: 'success', code: 200 })
  } catch (err) {
    return handleError(res, err)
  }
}

/**
 * POST /api/categories — admin only.
 */
export async function createCategory(req: Request, res: Response) {
  try {
    const category = await categoryService.createCategory(req.body)
    return res.status(201).json({ data: CategoryResource(category as any), status: 'success', code: 201 })
  } catch (err) {
    return handleError(res, err)
  }
}

/**
 * PUT /api/categories/:id — admin only.
 */
export async function updateCategory(req: Request, res: Response) {
  try {
    const category = await categoryService.updateCategory(req.params.id as string, req.body)
    return res.json({ data: CategoryResource(category as any), status: 'success', code: 200 })
  } catch (err) {
    return handleError(res, err)
  }
}

/**
 * DELETE /api/categories/:id — admin only.
 */
export async function deleteCategory(req: Request, res: Response) {
  try {
    await categoryService.deleteCategory(req.params.id as string)
    return res.status(204).send()
  } catch (err) {
    return handleError(res, err)
  }
}
