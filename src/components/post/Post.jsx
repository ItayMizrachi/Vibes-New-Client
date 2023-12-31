import {
  BookmarkIcon,
  ChatIcon,
  DotsHorizontalIcon,
  HeartIcon,
  TrashIcon,
} from "@heroicons/react/outline";
import {
  BookmarkIcon as FullBookMarkIcon,
  HeartIcon as FullHeart,
} from "@heroicons/react/solid";
import { useLazyLoading } from "mg-js";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { MyContext } from "../../context/myContext";
import {
  TOKEN_KEY,
  URL,
  doApiGet,
  doApiMethod,
} from "../../services/apiService";
import AddComment2 from "./AddComment2";
import Comments from "./Comments";
import EditPost3 from "./EditPost3";
import LikesList from "./LikesList";

const Post = ({
  postsInfo,
  likes,
  likesLength,
  _id,
  user_name,
  img_url,
  description,
  profilePic,
  user_id,
  date_created,
}) => {
  const [commentsInfo, setCommentsInfo] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Add state for loading
  const [likesCount, setLikesCount] = useState(likesLength);
  const [showLikes, setShowLikes] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { deletePost, userData } = useContext(MyContext);
  const [newCommentPosted, setNewCommentPosted] = useState(false);
  const [hasNewComment, setHasNewComment] = useState(false);

  const createLikeNotification = async (userId, postId, senderId) => {
    try {
      const url = URL + "/notifications/like";
      const body = { userId, postId, senderId };
      await doApiMethod(url, "POST", body);
    } catch (error) {
      console.log(error);
    }
  };

  // Function to create a comment notification
  const createCommentNotification = async (
    userId,
    postId,
    senderId,
    commentId
  ) => {
    try {
      const url = URL + "/notifications/comment";
      const body = { userId, postId, senderId, commentId };
      await doApiMethod(url, "POST", body);
    } catch (error) {
      console.log(error);
    }
  };

  const likePost = async (_id) => {
    try {
      const url = URL + "/userPosts/like/" + _id;
      const urlSinglePost = URL + "/userPosts/single/" + _id;
      //add the post to the liked_posts array :
      const url_Liked_array = URL + "/userPosts/liked_posts_array/" + _id;
      await doApiMethod(url, "PUT");
      await doApiMethod(url_Liked_array, "PUT");
      const resp = await doApiGet(urlSinglePost);
      if (!isLiked) {
        if (user_id != userData._id) {
          await createLikeNotification(user_id, _id, userData._id);
        }
      } else deleteLikeNotification(userData._id, _id);

      setLikesCount(resp.likes.length);
      setIsLiked(!isLiked);
    } catch (error) {
      console.log(error);
    }
  };

  const deleteLikeNotification = async (senderId, post_id) => {
    try {
      const url = URL + "/notifications/unlike/" + senderId + "/" + post_id;
      await doApiMethod(url, "DELETE");
      console.log("Success");
    } catch (error) {
      console.log(error);
    }
  };

  const savePost = async (_id) => {
    try {
      const url = URL + "/userPosts/save/" + _id;
      await doApiMethod(url, "PUT");
      setIsSaved(!isSaved);
    } catch (error) {
      console.log(error);
    }
  };

  const [page, setPage] = useState(1);

  // Increment the page whenever the threshold is reached
  const incrementPage = () => setPage((prevPage) => prevPage + 1);

  const [Intersector] = useLazyLoading(
    {
      initPage: page,
      distance: "4px",
      targetPercent: 0.5,
      uuidKeeper: _id,
    },
    incrementPage
  );

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const url = URL + `/comments/${_id}?page=${page}`;
        const resp = await fetch(url);
        const arr = await resp.json();
        setCommentsInfo((prevComments) => [...prevComments, ...arr]);
      } catch (error) {
        console.log(error);
      }
    };

    fetchComments();
  }, [page]);

  const doApiPostComment = async (_bodyData) => {
    try {
      const url = URL + "/comments/" + _id;
      const response = await doApiMethod(url, "POST", _bodyData);

      const commentId = response._id;
      // console.log(response);
      reset();

      // Update the state variable to indicate a new comment has been posted

      if (user_id !== userData._id) {
        await createCommentNotification(user_id, _id, userData._id, commentId);
      }
      setCommentsInfo((prevComments) => [response, ...prevComments]);
    } catch (error) {
      console.log(error);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      if (window.confirm("Are you sure you want to delete this comment")) {
        const url = URL + "/comments/" + commentId + "/" + user_id;
        await doApiMethod(url, "DELETE");

        setCommentsInfo((prevData) =>
          prevData.filter((c) => c._id !== commentId)
        );
        // Delete the associated comment notification
        deleteCommentNotification(commentId);
        // Refresh comments
        // doApiComments();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteCommentNotification = async (commentId) => {
    try {
      const url = URL + "/notifications/uncomment/" + commentId;
      await doApiMethod(url, "DELETE");
      console.log("Success");
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // doApiComments();
    if (likes?.includes(userData.user_name)) {
      setIsLiked(true);
    }
    if (userData?.saved_posts?.includes(_id)) {
      setIsSaved(true);
    }
  }, []);

  const { register, handleSubmit, reset } = useForm();

  const onSubForm = (_bodyData) => {
    // console.log(_bodyData);
    setIsLoading(true); // Start loading when form is submitted
    doApiPostComment(_bodyData);
  };

  const [showEdit, setShowEdit] = useState(false);

  return (
    <div className=" border rounded-2xl my-7 shadow-sm dark:bg-slate-800 dark:border-none">
      {showEdit && (
        <EditPost3
          setShowEdit={setShowEdit}
          post_id={_id}
          description={description}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between p-5 space-x-3">
        <div className="flex items-center space-x-3">
          <Link to={"/" + user_name}>
            <div className="w-12 h-12">
              <img
                src={
                  user_id === userData._id ? userData.profilePic : profilePic
                }
                alt=""
                className="object-cover w-full h-full rounded-full border p-[1px] hover:border-gray-400 transition duration-200 dark:hover:border-slate-600 dark:border-slate-700"
              />
            </div>
          </Link>
          <Link
            to={"/" + user_name}
            className="font-semibold text-lg hover:text-gray-600 dark:hover:text-gray-400 transition duration-200"
          >
            {user_name}
          </Link>
        </div>
        {user_id === userData._id && (
          <>
            <DotsHorizontalIcon
              onClick={() => setShowEdit(true)}
              className="h-5 cursor-pointer dark:hover:text-gray-400"
            />
          </>
        )}
        {/* h-10 w-10 cursor-pointer hover:text-gray-600 transition duration-200 */}
      </div>

      {/* Image */}
      <Link to={"/singlepost/" + _id}>
        <img src={img_url} alt="post" className="object-cover w-full" />
      </Link>

      {/* Buttons */}
      {localStorage[TOKEN_KEY] && (
        <div className="flex justify-between p-4">
          <div className="flex space-x-4">
            {isLiked ? (
              <FullHeart
                onClick={() => likePost(_id)}
                className="post-btn text-red-500 dark:text-red-400"
              />
            ) : (
              <HeartIcon onClick={() => likePost(_id)} className="post-btn" />
            )}

            <ChatIcon className="post-btn" />
          </div>

          {user_name === userData.user_name ? (
            <TrashIcon
              onClick={() => deletePost(_id)}
              className="post-btn hover:text-red-500 dark:hover:text-red-400"
            />
          ) : (
            <>
              {isSaved ? (
                <FullBookMarkIcon
                  onClick={() => savePost(_id)}
                  className="post-btn"
                />
              ) : (
                <BookmarkIcon
                  onClick={() => savePost(_id)}
                  className="post-btn"
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Caption */}
      <div className="p-5 pt-3">
        <div
          onClick={() => setShowLikes(true)}
          className="mb-3 font-semibold cursor-pointer hover:text-gray-600 dark:hover:text-gray-400 transition duration-200"
        >
          {likesCount} likes
        </div>
        {showLikes && <LikesList setShowLikes={setShowLikes} likes={likes} />}
        <div className="flex justify-between">
          <div className="flex space-x-2">
            <Link
              to={"/" + user_name}
              className="font-semibold hover:text-gray-600 dark:hover:text-gray-400"
            >
              {user_name}
            </Link>
            <p>{description}</p>
          </div>
          <p className="text-gray-500">{moment(date_created).fromNow()}</p>
        </div>
      </div>

      {/* Comments */}
      <Comments
        user_id={user_id}
        deleteComment={deleteComment}
        commentsInfo={commentsInfo}
        Intersector={Intersector}
      />

      {/* input box */}
      <AddComment2
        handleSubmit={handleSubmit}
        register={register}
        onSubForm={onSubForm}
      />
    </div>
  );
};

export default Post;
