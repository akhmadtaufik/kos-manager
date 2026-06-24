
const schema = z.object({
  name: z.string().min(1, 'Name is required')
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)
  return { success: true, data: body }
})
