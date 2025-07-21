import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import userImg from "../assets/user.gif"
import Button from './Button'
import { minimalButtonStyle } from '../components/ButtonStyle'

function Home() {
    const stopTimeoutRef = useRef(null);//add
    const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext)
    const navigate = useNavigate()
    const [listening, setListening] = useState(false)
    const [userText, setUserText] = useState("")
    const [aiText, setAiText] = useState("")
    const isSpeakingRef = useRef(false)
    const recognitionRef = useRef(null)
    const [ham, setHam] = useState(false)
    const isRecognizingRef = useRef(false)
    const transcriptRef = useRef("");
    const [isRecordingManually, setIsRecordingManually] = useState(false);//added
    const [SearchQuery, setSearchQuery] = useState(null)
    const [type, setType] = useState(null);//add
    const [userInput, setUserInput] = useState(null);

    const synth = window.speechSynthesis

    const handleLogOut = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/auth/logout`, {
                withCredentials: true,
            });

            if (result.status === 200) {
                setUserData(null);
                navigate("/signin");
            } else {
                console.error("Logout failed with status:", result.status);
            }
        } catch (error) {
            console.error("Logout error:", error);
            alert("Logout failed. Please try again.");
        }
    };


    const startRecognition = () => {
        if (!isSpeakingRef.current && !isRecognizingRef.current) {
            try {
                transcriptRef.current = ""; // reset transcript
                recognitionRef.current?.start();
                setIsRecordingManually(true);
                console.log("Recording started for 10 seconds");

                // Stop after 10 seconds
                stopTimeoutRef.current = setTimeout(() => {
                    recognitionRef.current?.stop();
                }, 10000);

            } catch (error) {
                if (error.name !== "InvalidStateError") {
                    console.error("Start error:", error);
                }
            }
        }
    };


    const speak = (text) => {
        const utterence = new SpeechSynthesisUtterance(text)
        utterence.lang = 'hi-IN';
        const voices = window.speechSynthesis.getVoices()
        const hindiVoice = voices.find(v => v.lang === 'hi-IN');
        if (hindiVoice) {
            utterence.voice = hindiVoice;
        }


        isSpeakingRef.current = true
        utterence.onend = () => {
            setAiText("");
            isSpeakingRef.current = false;
            setIsRecordingManually(false);
            setTimeout(() => {

            }, 800);
        }
        synth.cancel(); // 🛑 pehle se koi speech ho to band karo
        synth.speak(utterence);
    }



    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognitionRef.current = recognition;

        let isMounted = true;  // flag to avoid setState on unmounted component

        // Start recognition after 1 second delay only if component still mounted
        // const startTimeout = setTimeout(() => 
        // {
        //     if (isMounted && !isSpeakingRef.current && !isRecognizingRef.current) {
        //         try {
        //             recognition.start();
        //             console.log("Recognition requested to start");
        //         } catch (e) {
        //             if (e.name !== "InvalidStateError") {
        //                 console.error(e);
        //             }
        //         }
        //     }
        // }, 1000);

        recognition.onstart = () => {
            console.log(" Listening...");

            isRecognizingRef.current = true;
            setListening(true);
        };

        // recognition.onend = () => {
        //     console.log("ended !");
        //     isRecognizingRef.current = false;
        //     setListening(false);
        //     setIsRecordingManually(false);  //ami add korlam
        // if (isMounted && !isSpeakingRef.current) {
        //     setTimeout(() => {
        //         if (isMounted) {
        //             try {
        //                 recognition.start();
        //                 console.log("Recognition restarted");
        //             } catch (e) {
        //                 if (e.name !== "InvalidStateError") console.error(e);
        //             }
        //         }
        //     }, 1000);
        // }
        //     console.log("inputy stopped");

        // };
        recognition.onend = async () => {
            setListening(false);
            isRecognizingRef.current = false;
            setIsRecordingManually(false);

            const finalTranscript = transcriptRef.current.trim();
            console.log("Full command:", finalTranscript);

            if (!finalTranscript) return;

            setAiText("");
            setUserText(finalTranscript);

            try {
                const data = await getGeminiResponse(finalTranscript);
                handleCommand(data);
                console.log(data);
                setAiText(data.response);
                setUserText("");
            } catch (err) {
                console.error("Gemini response error:", err);
                setAiText(" Error fetching assistant response.");
            }

            transcriptRef.current = ""; // reset for next round
        };




        recognition.onerror = (event) => {
            console.warn("Recognition error:", event.error);
            isRecognizingRef.current = false;
            setListening(false);
            setIsRecordingManually(false);  //ami add korlam
            // if (event.error !== "aborted" && isMounted && !isSpeakingRef.current) {
            //     setTimeout(() => {
            //         if (isMounted) {
            //             try {
            //                 recognition.start();
            //                 console.log("Recognition restarted after error");
            //             } catch (e) {
            //                 if (e.name !== "InvalidStateError") console.error(e);
            //             }
            //         }
            //     }, 1000);
            // }
        };

        recognition.onresult = async (e) => {
            const transcript = e.results[e.results.length - 1][0].transcript.trim();
            transcriptRef.current += " " + transcript;
            console.log(" ami bolchi:::", transcript);
            console.log("added :", transcript); //sunlo eta
            // if (transcript.toLowerCase().includes(userData.assistantName.toLowerCase())) {
            //     setAiText("");
            //     setUserText(transcript);
            //     recognition.stop();
            //     isRecognizingRef.current = false;
            //     setListening(false);
            //     const data = await getGeminiResponse(transcript);
            //     handleCommand(data);
            //     console.log(data.response);
            //     setAiText(data.response);
            //     setIsRecordingManually(false);  // added
            //     setUserText("");
            // }
        };


        const greeting = new SpeechSynthesisUtterance(`Hello ${userData.name}`);
        greeting.lang = 'hi-IN';

        window.speechSynthesis.speak(greeting);


        return () => {
            isMounted = false;
            //clearTimeout(startTimeout);
            recognition.stop();
            setListening(false);
            isRecognizingRef.current = false;
        };
    }, []);



    const handleCommand = (data) => {

        const { type, userInput, response } = data
        console.log(type);
        setType(type);
        setUserInput(userInput);
        setSearchQuery(userInput);
        if (type === 'google-search') {
            const query = encodeURIComponent(userInput);
            setSearchQuery(query);
        }
        
        // if (type === "instagram-open") {
        //     window.open(`https://www.instagram.com/`, '_blank');
        // }
        // if (type === "facebook-open") {
        //     window.open(`https://www.facebook.com/`, '_blank');
        // }
        // if (type === "weather-show") {
        //     window.open(`https://www.google.com/search?q=weather`, '_blank');
        // }
        //
        // if (type === 'youtube-search' || type === 'youtube-play') {
        //     setSearchQuery(userInput); // button korbo
            // jsx element return e dite hobe ekhane hobe na
            // {
            //     SearchQuery && (
            //         <button
            //             onClick={() =>
            //                 window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(SearchQuery)}`, '_blank')
            //             }
            //             className="bg-red-500 text-white px-4 py-2 rounded"
            //         >
            //             Open YouTube for: {SearchQuery}
            //         </button>
            //     )
            // }
        //}
        speak(response);
    }


    return (
        <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden'>
            <CgMenuRight className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={() => setHam(true)} />
            <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham ? "translate-x-0" : "translate-x-full"} transition-transform`}>

                <RxCross1 className=' text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={() => setHam(false)} />
                <button className='min-w-[150px] h-[60px]  text-black font-semibold   bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
                <button className='min-w-[150px] h-[60px]  text-black font-semibold  bg-white  rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] ' onClick={() => navigate("/customize")}>Customize your Assistant</button>

                <div className='w-full h-[2px] bg-gray-400'></div>
                <h1 className='text-white font-semibold text-[19px]'>History</h1>

                <div className='w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col truncate'>
                    {userData.history?.map((his, index) => (

                        <div key={index} className='text-gray-200 text-[18px] w-full h-[30px]  '>{his}</div>
                    ))}

                </div>

            </div>
            <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px]  bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
            <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold  bg-white absolute top-[100px] right-[20px] rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] hidden lg:block ' onClick={() => navigate("/customize")}>Customize your Assistant</button>
            <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>
                <img src={userData?.assistantImage} alt="" className='h-full object-cover' />
            </div>
            <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
            {!aiText && <img src={userImg} alt="" className='w-[200px]' />}
            {aiText && <img src={aiImg} alt="" className='w-[200px]' />}

            <h1 className='text-white text-[18px] font-semibold text-wrap'>{userText ? userText : aiText ? aiText : null}</h1>
            {/** */}
            <Button
                onClick={startRecognition}
                isListening={isRecordingManually && listening}
            />
            {   //for youtube
                (type === 'youtube-search' || type === 'youtube-play') &&

                SearchQuery && (
                    <button 

                        onClick={() =>
                            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(SearchQuery)}`, '_blank')
                        }
                         className={minimalButtonStyle}
                    >
                        {type}: {SearchQuery}
                    </button>
                )
}
                //for weather
               { (type === 'weather-show') &&
    // window.open(`https://www.google.com/search?q=weather`, '_blank');
                 (
                    <button
                        onClick={() =>
                            window.open(`https://www.google.com/search?q=weather`, '_blank')
                        }
                        className={minimalButtonStyle}
                    >
                        {type}: {SearchQuery}
                    </button>
                )
            }
            {
                (type === "facebook-open")&& <button
                        onClick={() =>
                            window.open(`https://www.facebook.com/`, '_blank')
                        }
                        className={minimalButtonStyle}
                    >
                        {type}: {SearchQuery}
                    </button>

            }
            {
            //insta
                 (type === "instagram-open")&& 
                 <button
                        onClick={() =>
                            window.open(`https://www.instagram.com/`, '_blank')
                        }
                        className={minimalButtonStyle}
                    >
                        {type}: {SearchQuery}
                    </button>
        }
        {
            //google
             (type === 'google-search') &&
             <button
             
                        onClick={() =>
                            window.open(`https://www.google.com/search?q=${SearchQuery}`, '_blank')
                        }
                       className={minimalButtonStyle}
                    >
                        {type}
                    </button>
        }
        {
            //calc
            (type === 'calculator-open') &&
            <button
             
                        onClick={() =>
                             window.open(`https://www.google.com/search?q=calculator`, '_blank')
                        }
                       className={minimalButtonStyle}
                    >
                        {type}
                    </button>

           
        
        }
         
        </div>

    )
}

export default Home