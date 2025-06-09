import { RevealOnScroll } from "../RevealOnScroll";
export const Home = () => {
    return (
        <section id="home" className="flex flex-col items-center justify-center min-h-screen">
        <RevealOnScroll>
        <div className="text-center z-10 px-4">
            <h1 className="masked-text text-3xl sm:text-6xl mb-3">Time Tracker App</h1>
            <p className="text-sm sm:text-xl mb-10 font-semibold bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text text-transparent leading-right">Track your time efficiently and effectively</p>
            <p className="text-sm sm:text-xl font-semibold bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text text-transparent leading-right">Time Tracker puts you in charge of your workday without overcomplicated things. Just click start when you begin a task and stop when it's complete — easy as that. Regardless of whether you're working individually or with others, Time Tracker has it all in order so that you can get whatever you need done. No clutter, no confusion — just an easy method of tracking time and remaining productive.</p>
            <div className="flex items-center justify-center space-x-4">
            <button
            onClick={() => {
                document.getElementById("login")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-lg sm:text-lg md:text-2xl mt-10 px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-lg shadow-white shadow-md animate-pulse transition duration-300"
            >
            Click to start
            </button>
            </div>
        </div>
        </RevealOnScroll>
        </section>
    )
}