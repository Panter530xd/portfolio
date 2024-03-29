import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { z } from "zod";

const commentSchema = z.object({
  title: z.string().min(1),
  postId: z.string().cuid(),
});

type CommentData = z.infer<typeof commentSchema>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET FOR COMMENTS
    try {
      const data = await prisma.comment.findMany({
        include: {
          user: true, // include the related user for each comment
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      res.status(200).json(data);
    } catch (err) {
      res.status(403).json({ err: "Error fetching posts" });
    }
  }

  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      res
        .status(401)
        .json({ message: "Please signin to post a comment." });

      return;
    }

    const prismaUser = await prisma.user.findUnique({
      where: { email: session?.user?.email! },
    });

    if (!prismaUser) {
      res.status(404).json({ err: "No such user in DB." });
      return;
    }

    try {
      const commentData = commentSchema.parse(req.body.data);

      const result = await prisma.comment.create({
        data: {
          title: commentData.title,
          userId: prismaUser.id,
          postId: commentData.postId,
        },
      });
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errorMap: { [k: string]: string } = {};

        err.errors.forEach((error) => {
          if (error.path) {
            errorMap[error.path[0]] = error.message;
          }
        });

        res.status(422).json({ errors: errorMap });
      } else {
        res
          .status(500)
          .json({ error: "An unexpected error has occurred." });
      }
    }
  }
}
