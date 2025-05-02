import React from 'react';
import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ControlBar, Player } from 'video-react';
import {
  BigPlayButton,
  LoadingSpinner,
  PlaybackRateMenuButton,
  ForwardControl,
  ReplayControl,
  CurrentTimeDisplay,
  TimeDivider,
} from 'video-react';
import { BiSkipPreviousCircle } from 'react-icons/bi';
import { BiSkipNextCircle } from 'react-icons/bi';
import { MdOutlineReplayCircleFilled } from 'react-icons/md';
import { markLectureAsComplete } from '../../../services/operations/courseDetailsAPI';
import { setCompletedLectures } from '../../../slices/viewCourseSlice';

const VideoDetails = () => {
  const { courseId, sectionId, subsectionId } = useParams();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);
  const {
    courseSectionData,
    courseEntireData,
    completedLectures,
    totalNoOfLectures,
  } = useSelector((state) => state.viewCourse);
  const navigate = useNavigate();
  const playerRef = React.useRef(null);

  const [videoData, setVideoData] = useState([]);
  const [videoEnd, setVideoEnd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (courseSectionData.length === 0) {
      return;
    }
    const filteredSection = courseSectionData?.filter(
      (section) => section._id === sectionId
    );
    const filteredSubsection = filteredSection[0]?.subSection?.filter(
      (subsection) => subsection._id === subsectionId
    );
    setVideoData(filteredSubsection?.[0]);
    setVideoEnd(false);
  }, [courseSectionData, sectionId, subsectionId]);

  const isLastLecture = () => {
    const currentSectionIndex = courseSectionData?.findIndex(
      (section) => section._id === sectionId
    );
    const currentSubsectionIndex = courseSectionData[
      currentSectionIndex
    ]?.subSection.findIndex(
      (subsection) => subsection._id === subsectionId
    );
    if (
      currentSubsectionIndex ===
        courseSectionData[currentSectionIndex]?.subSection?.length - 1 &&
      currentSectionIndex === courseSectionData?.length - 1
    ) {
      return true;
    } else {
      return false;
    }
  };

  const isFirstLecture = () => {
    const currentSectionIndex = courseSectionData?.findIndex(
      (section) => section._id === sectionId
    );
    const currentSubsectionIndex = courseSectionData[
      currentSectionIndex
    ]?.subSection.findIndex(
      (subsection) => subsection._id === subsectionId
    );
    if (
      currentSubsectionIndex === 0 &&
      currentSectionIndex === 0
    ) {
      return true;
    } else {
      return false;
    }
  };

  const nextLecture = () => {
    if (isLastLecture()) {
      return;
    }
    const currentSectionIndex = courseSectionData?.findIndex(
      (section) => section._id === sectionId
    );
    const currentSubsectionIndex = courseSectionData[
      currentSectionIndex
    ]?.subSection.findIndex(
      (subsection) => subsection._id === subsectionId
    );
    if (
      currentSubsectionIndex ===
      courseSectionData[currentSectionIndex]?.subSection.length - 1
    ) {
      const nextSectionId =
        courseSectionData[currentSectionIndex + 1]?._id;
      const nextSubsectionId =
        courseSectionData[currentSectionIndex + 1]?.subSection[0]._id;
      navigate(
        `/dashboard/enrolled-courses/view-course/${courseId}/section/${nextSectionId}/sub-section/${nextSubsectionId}`
      );
    } else {
      const nextSectionId = courseSectionData[currentSectionIndex]._id;
      const nextSubsectionId =
        courseSectionData[currentSectionIndex].subSection[
          currentSubsectionIndex + 1
        ]._id;
      navigate(
        `/dashboard/enrolled-courses/view-course/${courseId}/section/${nextSectionId}/sub-section/${nextSubsectionId}`
      );
    }
  };

  const previousLecture = () => {
    if (isFirstLecture()) {
      return;
    }
    const currentSectionIndex = courseSectionData?.findIndex(
      (section) => section._id === sectionId
    );
    const currentSubsectionIndex = courseSectionData[
      currentSectionIndex
    ]?.subSection.findIndex(
      (subsection) => subsection._id === subsectionId
    );
    if (currentSubsectionIndex === 0) {
      const previousSectionId =
        courseSectionData[currentSectionIndex - 1]._id;
      const previousSubsectionId =
        courseSectionData[currentSectionIndex - 1]?.subSection[
          courseSectionData[currentSectionIndex - 1].subSection.length - 1
        ]._id;
      navigate(
        `/dashboard/enrolled-courses/view-course/${courseId}/section/${previousSectionId}/sub-section/${previousSubsectionId}`
      );
    } else {
      const previousSectionId = courseSectionData[currentSectionIndex]?._id;
      const previousSubsectionId =
        courseSectionData[currentSectionIndex]?.subSection[
          currentSubsectionIndex - 1
        ]._id;
      navigate(
        `/dashboard/enrolled-courses/view-course/${courseId}/section/${previousSectionId}/sub-section/${previousSubsectionId}`
      );
    }
  };

  const handleLectureCompletion = async () => {
    const res = await markLectureAsComplete(
      {
        userId: user._id,
        courseId: courseId,
        subSectionId: subsectionId,
      },
      token
    );
    dispatch(setCompletedLectures([...completedLectures, videoData._id]));
  };

  return (
    <div className="md:w-[calc(100vw-320px)] w-screen p-3">
      {!videoData ? (
        <h1>Loading...</h1>
      ) : (
        <div>
          <Player
            className="w-full relative"
            ref={playerRef}
            src={videoData.videoUrl}
            aspectRatio="16:9"
            fluid={true}
            autoPlay={false}
            onEnded={() => setVideoEnd(true)}
          >
            <BigPlayButton position="center" />
            <LoadingSpinner />
            <ControlBar>
              <PlaybackRateMenuButton rates={[5, 2, 1, 0.5, 0.1]} order={7.1} />
              <ReplayControl seconds={5} order={7.1} />
              <ForwardControl seconds={5} order={7.2} />
              <TimeDivider order={4.2} />
              <CurrentTimeDisplay order={4.1} />
              <TimeDivider order={4.2} />
            </ControlBar>
            {videoEnd && (
              <div className="flex justify-center items-center">
                <div className="flex justify-center items-center">
                  {!completedLectures.includes(videoData._id) && (
                    <button
                      onClick={() => {
                        handleLectureCompletion();
                      }}
                      className="bg-yellow-100 text-richblack-900 absolute top-[20%] hover:scale-90 z-20 font-medium md:text-sm px-4 py-2 rounded-md"
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
                {!isFirstLecture() && (
                  <div className=" z-20 left-0 top-1/2 transform -translate-y-1/2 absolute m-5">
                    <BiSkipPreviousCircle
                      onClick={previousLecture}
                      className=" text-2xl md:text-5xl bg-richblack-600 rounded-full cursor-pointer hover:scale-90"
                    />
                  </div>
                )}
                {!isLastLecture() && (
                  <div className=" z-20 right-4 top-1/2 transform -translate-y-1/2 absolute m-5">
                    <BiSkipNextCircle
                      onClick={nextLecture}
                      className="text-2xl md:text-5xl bg-richblack-600 rounded-full cursor-pointer hover:scale-90"
                    />
                  </div>
                )}
                {
                  <MdOutlineReplayCircleFilled
                    onClick={() => {
                      playerRef.current.seek(0);
                      playerRef.current.play();
                      setVideoEnd(false);
                    }}
                    className="text-2xl md:text-5xl bg-richblack-600 rounded-full cursor-pointer hover:scale-90 absolute top-1/2 z-20"
                  />
                }
              </div>
            )}
          </Player>
        </div>
      )}
      <div className="mt-5">
        <h1 className="text-2xl font-bold text-richblack-25">
          {videoData?.title}
        </h1>
        <p className="text-gray-500 text-richblack-100">
          {videoData?.description}
        </p>
      </div>
      {/* Floating Take Test Button */}
      {isLastLecture() && (
        <div className="fixed bottom-5 right-5">
          <button
            onClick={() =>
              navigate(`/dashboard/enrolled-courses/view-course/${courseId}/test`)
            }
            className="bg-caribbeangreen-400 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-transform"
          >
            Take Test
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoDetails;