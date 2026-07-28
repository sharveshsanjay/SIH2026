import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile) {
      navigate("/dashboard", { replace: true });
    }
  }, [userProfile, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* Left Section - Login (50-55%) */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 lg:p-10 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md lg:max-w-[440px]"
        >
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 p-3 border border-gray-50/80">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOCuzHgCXlBsGLR4zFuT1kE9Ml-1WWsSW77TFpw_Fxz7X0WVkQE7m9ADQ&s=10"
                  alt="SIH Logo"
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1.5">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-500 font-normal">
              Sign in to access the Smart India Hackathon Internal Platform
            </p>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-5">
              <CardTitle className="text-xl font-semibold text-gray-800">
                Sign in
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm">
                Access is restricted to authorized team members only.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0 space-y-5">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 px-4 rounded-xl border-gray-200 bg-gray-50/70 focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200 placeholder:text-gray-400 text-gray-800 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 px-4 rounded-xl border-gray-200 bg-gray-50/70 focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200 pr-12 text-gray-800 text-sm"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                      onClick={() => {
                        const input = document.getElementById('password') as HTMLInputElement;
                        if (input) {
                          input.type = input.type === 'password' ? 'text' : 'password';
                        }
                      }}
                      aria-label="Toggle password visibility"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-400/30 focus:ring-offset-0 transition-all duration-200 cursor-pointer"
                    />
                    <span className="group-hover:text-gray-800 transition-colors duration-200">Remember Me</span>
                  </label>
                  <a href="#" className="text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline transition-colors duration-200">
                    Forgot Password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-0"
                  disabled={loading}
                >
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign in with Email
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-gray-400 font-medium tracking-wider">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-2 border-gray-200 bg-gray-50/50 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all duration-300 font-medium text-gray-700"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google Sign In
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-400 font-medium mt-6">
            Registration is disabled. Contact your admin for access.
          </p>
        </motion.div>
      </div>

      {/* Right Section - Hero (45-50%) */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#0a1628] via-[#142340] to-[#0a1628] relative overflow-hidden items-center justify-center p-10">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-[0.06]">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" />
              <path d="M25 0 L0 25" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M0 0 L25 25" stroke="white" strokeWidth="0.5" fill="none" />
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Blurred circles */}
        <div className="absolute top-12 right-12 w-32 h-32 rounded-full bg-blue-400/10 blur-3xl"></div>
        <div className="absolute bottom-12 left-12 w-40 h-40 rounded-full bg-cyan-400/10 blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-24 h-24 rounded-full bg-purple-400/10 blur-2xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-20 h-20 rounded-full bg-blue-500/10 blur-2xl"></div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          className="relative z-10 w-full max-w-lg"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 border border-white/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            <span className="text-xs font-medium text-blue-300 uppercase tracking-wider">SIH Internal Platform</span>
          </div>

          {/* Hero Text */}
          <h2 className="text-4xl font-bold text-white leading-tight mb-3">
            Team Workspace 2026
            <br />
            <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
              Smart India Hackathon
            </span>
          </h2>

          <p className="text-gray-300/70 text-sm leading-relaxed max-w-md mb-8">
            Secure internal workspace for authorized team members. Collaborate, manage projects, and access resources through a unified platform.
          </p>

          {/* Stats Cards - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="p-2 bg-blue-400/10 rounded-xl group-hover:bg-blue-400/20 transition-colors">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-white font-bold text-xl">24+</span>
              </div>
              <p className="text-gray-400 text-xs font-medium">Teams</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="p-2 bg-cyan-400/10 rounded-xl group-hover:bg-cyan-400/20 transition-colors">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-white font-bold text-xl">100+</span>
              </div>
              <p className="text-gray-400 text-xs font-medium">Participants</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="p-2 bg-purple-400/10 rounded-xl group-hover:bg-purple-400/20 transition-colors">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="text-white font-bold text-xl">12</span>
              </div>
              <p className="text-gray-400 text-xs font-medium">Mentors</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="p-2 bg-green-400/10 rounded-xl group-hover:bg-green-400/20 transition-colors">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-white font-bold text-xl">SIH</span>
              </div>
              <p className="text-gray-400 text-xs font-medium">Internal Access</p>
            </div>
          </div>

          {/* Tech tags */}
          <div className="mt-6 flex flex-wrap items-center gap-2 text-gray-400/50 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Secure
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Collaborative
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              Innovative
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
