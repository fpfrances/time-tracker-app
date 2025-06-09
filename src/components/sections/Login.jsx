import { useState } from 'react';
import { RevealOnScroll } from '../RevealOnScroll';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signUpUser, loginUser } from '/src/supabase/db';
import { FaLinkedin, FaGithub } from 'react-icons/fa';

export const Login = () => {
  const [formType, setFormType] = useState('register');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // clear previous error

    if (formType === 'register') {
      // eslint-disable-next-line no-unused-vars
      const { data, error } = await signUpUser(email, password, name);

      if (error) {
        alert(`Signup Error: ${error.message}`);
        setError(error.message);
        return;
      }

      alert('Check your email to confirm your registration.');
    } else {
      // eslint-disable-next-line no-unused-vars
      const { data, error } = await loginUser(email, password);

      if (error) {
        alert(`Login Error: ${error.message}`);
        setError(error.message);
        return;
      }
      alert('Login successful!');
      navigate('/dashboard');
    }
  };

  return (
    <section
      id="login"
      className="flex flex-col items-center justify-center min-h-screen"
    >
      <RevealOnScroll>
        <div className="text-center z-10 px-4">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center justify-center px-10 py-6 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg shadow-md transition-all duration-500"
          >
            <div className="flex items-center justify-center space-x-8 mb-4">
              <button
                type="button"
                onClick={() => setFormType('register')}
                className={`text-lg px-5 border-r border-b border-white bg-transparent text-white font-semibold rounded-lg shadow-lg animate-pulse transition duration-300 ${
                  formType === 'register' ? 'shadow-white' : ''
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => setFormType('login')}
                className={`text-lg px-5 border-r border-b border-white bg-transparent text-white font-semibold rounded-lg shadow-lg animate-pulse transition duration-300 ${
                  formType === 'login' ? 'shadow-white' : ''
                }`}
              >
                Login
              </button>
            </div>

            <div className="w-full transition-opacity duration-500 ease-in-out">
              {formType === 'register' && (
                <div className="animate-fadeIn w-full">
                  <label className="block text-left text-lg font-semibold text-white mt-4">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="name..."
                    required
                    className="w-full mb-4 px-2 py-1.5 bg-transparent border border-white rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white shadow-lg"
                  />

                  <label className="block text-left text-lg font-semibold text-white">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email..."
                    required
                    className="w-full mb-4 px-2 py-1.5 bg-transparent border border-white rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white shadow-lg"
                  />

                  <label className="block text-left text-lg font-semibold text-white">
                    Password
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="password..."
                      required
                      className="w-full px-2 py-1.5 pr-10 bg-transparent border border-white rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {formType === 'login' && (
                <div className="animate-fadeIn w-full">
                  <label className="block text-left text-lg font-semibold text-white mt-4">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email..."
                    required
                    className="w-full mb-4 px-2 py-1.5 bg-transparent border border-white rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white shadow-lg"
                  />

                  <label className="block text-left text-lg font-semibold text-white">
                    Password
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="password..."
                      required
                      className="w-full px-2 py-1.5 pr-10 bg-transparent border border-white rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-red-500 mt-4">{error}</p>}

            <button
              type="submit"
              className="text-lg mt-10 px-5 border-r border-b border-white bg-transparent text-white font-semibold rounded-lg shadow-white shadow-lg animate-pulse transition duration-300"
            >
              Submit
            </button>
            <div className="translate-y-60 sm:translate-y-120 flex justify-center items-center gap-5">
              <a
                href="https://www.linkedin.com/in/filipefrances/"
                target="_blank"
              >
                <FaLinkedin className="text-3xl text-blue-500 hover:text-blue-600 transition" />
              </a>
              <a href="https://github.com/fpfrances" target="_blank">
                <FaGithub className="text-3xl text-gray-400 hover:text-white transition" />
              </a>
            </div>
          </form>
        </div>
      </RevealOnScroll>
    </section>
  );
};
