import db from '@/app/db'
import { z } from 'zod'
import { getServerSessionWithId } from '@/app/extensions/next-auth/helpers'
import handler from '@/utils/next-rest'
import { NotFoundError, UnauthorizedError, UnsupportedMethodError } from '@/spec/error'

export type GetUserProfileResponse = Awaited<ReturnType<typeof getUserProfile>>
export async function getUserProfile(id: string) {
  const user = await db.objects.user.findUnique({ where: { id } })
  if (user === null) throw new NotFoundError()
  return {
    image: user.image,
    name: user.name,
    email: user.email,
    affiliation: user.affiliation,
  }
}

export const UpdateUserProfileRequestParser = z.object({
  name: z.string().optional(),
  image: z.string().optional(),
  affiliation: z.string().optional(),
}).strict()
export type UpdateUserProfileRequest = z.TypeOf<typeof UpdateUserProfileRequestParser>
export type UpdateUserProfileResponse = Awaited<ReturnType<typeof updateUserProfile>>
export async function updateUserProfile(id: string, data: UpdateUserProfileRequest) {
  const user = await db.objects.user.update({
    where: { id },
    data,
  })
  if (user === null) throw new NotFoundError()
  return user
}

export default handler(async (req, res) => {
  const session = await getServerSessionWithId(req, res)
  if (!session || !session.user) throw new UnauthorizedError()
  if (req.method === 'GET') {
    return res.status(200).json(await getUserProfile(session.user.id))
  } else if (req.method === 'POST') {
    return res.status(200).json(await updateUserProfile(session.user.id, UpdateUserProfileRequestParser.parse(JSON.parse(req.body))))
  } else {
    throw new UnsupportedMethodError()
  }
})
