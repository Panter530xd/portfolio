import prisma from "../../../prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const data = await prisma.post.findMany({
        include: {
          user: true,
          comments: true,
          hearts: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      res.status(200).json(data);
    } catch (err) {
      res.status(403).json({ err: "Error fatching posts" });
    }
  }

  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res
        .status(401)
        .json({ message: "Please signin to create a post." });
    }

    const title: string = req.body.title;

    //Get User
    const prismaUser = await prisma.user.findUnique({
      where: { email: session?.user?.email! },
    });
    //Check title
    if (title.length > 300) {
      return res.status(403).json({ message: "Please write a shorter post" });
    }

    if (!title.length) {
      return res
        .status(403)
        .json({ message: "Please write something before we can post it." });
    }

    //Create Post
    try {
      const result = await prisma.post.create({
        data: {
          title,
          userId: prismaUser?.id!,
        },
      });
      res.status(200).json(result);
    } catch (err) {
      res.status(403).json({ err: "Error has occured while making a post" });
    }
  }
  if (req.method === "DELETE") {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res
        .status(401)
        .json({ message: "Please signin to create a post." });
    }

    const postId = req.body;
    try {
      const result = await prisma.post.delete({
        where: {
          id: postId,
        },
      });

      res.status(200).json(result);
    } catch (err) {
      res.status(403).json({ err: "Error has occured while deleting a post" });
    }
  }

  if (req.method === "PUT") {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res
        .status(401)
        .json({ message: "Please sign in to edit a post." });
    }

    const { id, newTitle }: {id: string, newTitle: string} = req.body;

    try {
      const updatedPost = await prisma.post.update({
        where: {
          id: id,
        },
        data: {
          title: newTitle,
        },
      });


      res.status(200).json(updatedPost);
    } catch (err) {
      res
        .status(403)
        .json({ err: "Error has occurred while updating the post" });
    }
  }
}
