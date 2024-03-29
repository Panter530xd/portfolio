"use client";

import Image from "next/image";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axios, { AxiosError } from "axios";
import { motion } from "framer-motion";
import UpdateToogle from "./UpdateToogle";

type EditProps = {
  id: string;
  avatar: string;
  name: string;
  title: string;
  comments?: {
    id: string;
    postId: string;
    userId: string;
  }[];
};

export default function EditPost({ title, id }: EditProps) {
  const [toggle, setToggle] = useState(false);
  const queryClient = useQueryClient();
  let deleteToastID: string;

  const { mutate } = useMutation(
    async ({ id, newTitle }: { id: string; newTitle: string }) => {
      await axios.put(`/api/posts`, { newTitle, id });
    },
    {
      onError: (error) => {
        if (error instanceof AxiosError) {
          toast.error(error?.response?.data.message, { id: deleteToastID });
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["auth-posts"]);
        toast.success("Post has been update.", { id: deleteToastID });
      },
    }
  );

  const updatePost = (newTitle: string) => {
    deleteToastID = toast.loading("Updating your post.", { id: deleteToastID });
    mutate({ id, newTitle });
  };

  return (
    <>
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        initial={{ opacity: 0, scale: 0.8 }}
        transition={{ ease: "easeOut" }}
      >
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setToggle(true);
            }}
            className="text-sm font-bold text-red-500 mt-[120px] xl:-ml-[250px]"
          >
            Edit
          </button>
        </div>
      </motion.div>
      {toggle && (
        <UpdateToogle
          updatePost={updatePost}
          setToggle={setToggle}
          title={title}
        />
      )}
    </>
  );
}
