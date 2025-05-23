import { useState } from "react";
import { RevealOnScroll } from "../RevealOnScroll";
import { Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [formType, setFormType] = useState("register");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <section
      id="login"
      className="flex flex-col items-center justify-center min-h-screen"
    >
      <RevealOnScroll>
        <div className="text-center z-10 px-4">
          <form className="flex flex-col items-center justify-center px-10 py-6 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg shadow-md transition-all duration-500">
            <div className="flex items-center justify-center space-x-8 mb-4">
              <button
                type="button"
                onClick={() => setFormType("register")}
                className={`text-lg px-5 border-r border-b border-white bg-transparent text-white font-semibold rounded-lg shadow-lg animate-pulse transition duration-300 ${
                  formType === "register" ? "shadow-white" : ""
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => setFormType("login")}
                className={`text-lg px-5 border-r border-b border-white bg-transparent text-white font-semibold rounded-lg shadow-lg animate-pulse transition duration-300 ${
                  formType === "login" ? "shadow-white" : ""
                }`}
              >
                Login
              </button>
            </div>

            {/* Form content */}
            <div className="w-full transition-opacity duration-500 ease-in-out">
              {formType === "register" && (
                <div className="animate-fadeIn w-full">
                  <label
                    for="name"
                    className="block w-full text-left text-lg font-semibold text-white mt-4"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    placeholder="name..."
                    required
                    className="w-full mb-4 px-2 py-1.5 bg-transparent border border-white rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white focus:shadow-white shadow-lg"
                  />

                  <label
                    for="email"
                    className="block w-full text-left text-lg font-semibold text-white"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="email..."
                    required
                    className="w-full mb-4 px-2 py-1.5 bg-transparent border border-white rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white focus:shadow-white shadow-lg"
                  />

                  <label
                    for="password"
                    className="block w-full text-left text-lg font-semibold text-white"
                  >
                    Password
                  </label>
                  <div className="relative w-full">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password-login"
                        placeholder="password..."
                        required
                        className="w-full px-2 py-1.5 pr-10 bg-transparent border border-white rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white focus:shadow-white shadow-lg"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white focus:outline-none"
                        tabIndex={-1} // prevent button from receiving focus on tab
                    >
                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    </div>
                </div>
              )}

              {formType === "login" && (
                <div className="animate-fadeIn w-full">
                  <label
                    for="email-login"
                    className="block w-full text-left text-lg font-semibold text-white mt-4"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email-login"
                    placeholder="email..."
                    required
                    className="w-full mb-4 px-2 py-1.5 bg-transparent border border-white rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white focus:shadow-white shadow-lg"
                  />

                  <label
                    for="password-login"
                    className="block w-full text-left text-lg font-semibold text-white"
                  >
                    Password
                  </label>
                  <div className="relative w-full">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password-login"
                        placeholder="password..."
                        required
                        className="w-full px-2 py-1.5 pr-10 bg-transparent border border-white rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white focus:shadow-white shadow-lg"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white focus:outline-none"
                        tabIndex={-1} // prevent button from receiving focus on tab
                    >
                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="text-lg mt-10 px-5 border-r border-b border-white bg-transparent text-white font-semibold rounded-lg shadow-white shadow-lg animate-pulse transition duration-300"
            >
              Submit
            </button>
          </form>
        </div>
      </RevealOnScroll>
    </section>
  );
};