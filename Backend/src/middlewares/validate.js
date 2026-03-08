/**
 * Validate request using Joi schema.
 * @param {Joi.ObjectSchema} schema - Joi schema
 * @param {Object} options - { source: 'body' | 'query' | 'params' }
 */
const validate = (schema, options = {}) => (req, res, next) => {
  const source = options.source || "body";
  const data = req[source];
  const { error } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: options.stripUnknown !== false,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join("; ");
    return res.status(400).json({
      success: false,
      message,
      errors: error.details.map((d) => ({ field: d.path.join("."), message: d.message })),
    });
  }

  next();
};

export default validate;
