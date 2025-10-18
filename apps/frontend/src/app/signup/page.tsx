'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { signupSchema, type SignupFormData } from '@/lib/validations/auth';
import { z } from 'zod';
import Image from 'next/image';

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignupFormData, string>>
  >({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setServerError('');
    setIsLoading(true);

    try {
      const validatedData = signupSchema.parse(formData);
      await signup(validatedData.email, validatedData.password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof SignupFormData, string>> = {};
        err.issues.forEach((issue) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0] as keyof SignupFormData] = issue.message;
          }
        });
        setErrors(fieldErrors);
      } else if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Signup failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange =
    (field: keyof SignupFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Visual */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 to-blue-700 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/30 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Free to get started
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Start monitoring in minutes
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Join thousands of developers who trust StatusFlow to keep their
              services online.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mt-12">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold">No credit card required</p>
                <p className="text-blue-100 text-sm">
                  Start with our free plan
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Real-time alerts</p>
                <p className="text-blue-100 text-sm">Get notified instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Self-hosted option</p>
                <p className="text-blue-100 text-sm">
                  Full control of your data
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-3 mb-8">
              <Image
                src="/logo.svg"
                alt="StatusFlow Logo"
                width={180}
                height={48}
                priority
              />
            </Link>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create your account
            </h2>
            <p className="text-gray-600">
              Start monitoring your services today
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-medium">Error</p>
                  <p className="text-sm mt-1">{serverError}</p>
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  className={`appearance-none relative block w-full px-4 py-3 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.email
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  className={`appearance-none relative block w-full px-4 py-3 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.password
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.password}
                  </p>
                )}
                {!errors.password && (
                  <p className="mt-2 text-xs text-gray-500">
                    8-20 characters with uppercase, lowercase, and number
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  className={`appearance-none relative block w-full px-4 py-3 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.confirmPassword
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
              >
                {isLoading ? (
                  <LoadingSpinner size="small" message="" />
                ) : (
                  <>
                    <span>Create account</span>
                    <svg
                      className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className="text-center pt-4">
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to home
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
