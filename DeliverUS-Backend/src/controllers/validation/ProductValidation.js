import { check } from 'express-validator'
import { Restaurant } from '../../models/models.js'
import { checkFileIsImage, checkFileMaxSize } from './FileValidationHelper.js'

const maxFileSize = 2000000 // around 2Mb

const checkRestaurantExists = async (value, { req }) => {
  try {
    const restaurant = await Restaurant.findByPk(req.body.restaurantId)
    if (restaurant === null) {
      return Promise.reject(new Error('The restaurantId does not exist.'))
    } else { return Promise.resolve() }
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}
/*
Debido a la normativa reguladora de alimentación, se pide que se informe al cliente de la cantidad de carbohidratos,
proteínas y grasas por cada 100 gramos de cada uno de los productos que están a la venta en DeliverUS.
*/

const check100grams = async (grasas, proteinas, carbohidratos) => {
  if (parseFloat(grasas) + parseFloat(proteinas) + parseFloat(carbohidratos) !== 100.0) {
    return Promise.reject(new Error('The sum of 100 grams cannot exceed 100.'))
  } else {
    return Promise.resolve()
  }
}

/*
Dada la existencia de platos hipercalóricos que no están recomendados en una dieta saludable, se pide que un plato no
pueda contener más de 1000 calorías por 100g de producto. Para ello, se usará la siguiente formula aproximada de cálculo
energético: Calorías producto = (grasas * 9) + (proteínas * 4) + (carbohidratos * 4)
*/

const noMoreThan1000Calories = async (grasas, proteinas, carbohidratos) => {
  if (parseFloat(grasas) * 9 + parseFloat(proteinas) * 4 + parseFloat(carbohidratos) * 4 > 1000.0) {
    return Promise.reject(new Error('The sum of 1000 calories cannot exceed 1000.'))
  } else {
    return Promise.resolve()
  }
}

const create = [
  check('name').exists().isString().isLength({ min: 1, max: 255 }).trim(),
  check('description').optional({ checkNull: true, checkFalsy: true }).isString().isLength({ min: 1 }).trim(),
  check('price').exists().isFloat({ min: 0 }).toFloat(),
  check('order').default(null).optional({ nullable: true }).isInt().toInt(),
  check('availability').optional().isBoolean().toBoolean(),
  check('productCategoryId').exists().isInt({ min: 1 }).toInt(),
  check('restaurantId').exists().isInt({ min: 1 }).toInt(),
  check('restaurantId').custom(checkRestaurantExists),
  check('image').custom((value, { req }) => {
    return checkFileIsImage(req, 'image')
  }).withMessage('Please upload an image with format (jpeg, png).'),
  check('image').custom((value, { req }) => {
    return checkFileMaxSize(req, 'image', maxFileSize)
  }).withMessage('Maximum file size of ' + maxFileSize / 1000000 + 'MB'),
  check('fats').custom((value, { req }) => {
    return check100grams(value, req.body.proteins, req.body.carbs)
  }).withMessage('The sum of 100 grams cannot exceed 100.'),
  check('fats').custom((value, { req }) => {
    return noMoreThan1000Calories(value, req.body.proteins, req.body.carbs)
  }).withMessage('The sum of 100 grams cannot exceed 100.')
]

const update = [
  check('name').exists().isString().isLength({ min: 1, max: 255 }),
  check('description').optional({ nullable: true, checkFalsy: true }).isString().isLength({ min: 1 }).trim(),
  check('price').exists().isFloat({ min: 0 }).toFloat(),
  check('order').default(null).optional({ nullable: true }).isInt().toInt(),
  check('availability').optional().isBoolean().toBoolean(),
  check('productCategoryId').exists().isInt({ min: 1 }).toInt(),
  check('restaurantId').not().exists(),
  check('image').custom((value, { req }) => {
    return checkFileIsImage(req, 'image')
  }).withMessage('Please upload an image with format (jpeg, png).'),
  check('image').custom((value, { req }) => {
    return checkFileMaxSize(req, 'image', maxFileSize)
  }).withMessage('Maximum file size of ' + maxFileSize / 1000000 + 'MB'),
  check('restaurantId').not().exists(),
  check('fats').custom((value, { req }) => {
    return check100grams(value, req.body.proteins, req.body.carbs)
  }).withMessage('The sum of 100 grams cannot exceed 100.'),
  check('fats').custom((value, { req }) => {
    return noMoreThan1000Calories(value, req.body.proteins, req.body.carbs)
  }).withMessage('The sum of 100 grams cannot exceed 100.')
]

export { create, update }
