'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Navigation sections
const sections = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'key-concepts', title: 'Key Concepts' },
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'authentication', title: 'Authentication' },
  { id: 'monitors', title: 'Monitors' },
  { id: 'alerts', title: 'Alerts' },
  { id: 'alert-rules', title: 'Alert Rules', indent: true },
  { id: 'notification-channels', title: 'Notification Channels', indent: true },
  { id: 'alert-history', title: 'Alert History', indent: true },
  { id: 'dashboard', title: 'Dashboard' },
  { id: 'reports', title: 'Reports' },
  { id: 'response-format', title: 'Response Format' },
  { id: 'rate-limits', title: 'Rate Limits' },
];

// Code block component with simple syntax highlighting
function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  const highlightCode = (code: string, lang: string) => {
    if (lang === 'json') {
      return code
        .replace(/"([^"]+)":/g, '<span class="text-purple-600">"$1"</span>:')
        .replace(/: "([^"]+)"/g, ': <span class="text-green-600">"$1"</span>')
        .replace(/: (\d+)/g, ': <span class="text-blue-600">$1</span>')
        .replace(/: (true|false|null)/g, ': <span class="text-orange-600">$1</span>');
    }
    if (lang === 'bash') {
      return code
        .replace(/^(curl|POST|GET|PATCH|DELETE|PUT)/gm, '<span class="text-green-600">$1</span>')
        .replace(/(-H|--header|-X|-d|--data)/g, '<span class="text-purple-600">$1</span>')
        .replace(/"([^"]+)"/g, '<span class="text-yellow-600">"$1"</span>');
    }
    return code;
  };

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
        >
          Copy
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }} />
      </pre>
    </div>
  );
}

// Endpoint component
function Endpoint({
  method,
  path,
  description,
  auth = true,
  requestBody,
  queryParams,
  pathParams,
  responseExample,
}: {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  auth?: boolean;
  requestBody?: string;
  queryParams?: { name: string; type: string; description: string; required?: boolean }[];
  pathParams?: { name: string; type: string; description: string }[];
  responseExample?: string;
}) {
  const methodColors = {
    GET: 'bg-green-100 text-green-700 border-green-200',
    POST: 'bg-blue-100 text-blue-700 border-blue-200',
    PATCH: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    PUT: 'bg-orange-100 text-orange-700 border-orange-200',
    DELETE: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-2 py-1 text-xs font-bold rounded border ${methodColors[method]}`}>
            {method}
          </span>
          <code className="text-sm font-mono text-gray-800">{path}</code>
          {auth && (
            <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
              Auth Required
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>

      <div className="p-4 space-y-4">
        {pathParams && pathParams.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-gray-700 mb-2">Path Parameters</h5>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Name</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Type</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {pathParams.map((param) => (
                    <tr key={param.name} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2 font-mono text-purple-600">{param.name}</td>
                      <td className="px-3 py-2 text-gray-600">{param.type}</td>
                      <td className="px-3 py-2 text-gray-600">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {queryParams && queryParams.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-gray-700 mb-2">Query Parameters</h5>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Name</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Type</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {queryParams.map((param) => (
                    <tr key={param.name} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2">
                        <span className="font-mono text-purple-600">{param.name}</span>
                        {param.required && (
                          <span className="ml-1 text-xs text-red-500">*</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{param.type}</td>
                      <td className="px-3 py-2 text-gray-600">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {requestBody && (
          <div>
            <h5 className="text-sm font-semibold text-gray-700 mb-2">Request Body</h5>
            <CodeBlock code={requestBody} language="json" />
          </div>
        )}

        {responseExample && (
          <div>
            <h5 className="text-sm font-semibold text-gray-700 mb-2">Response</h5>
            <CodeBlock code={responseExample} language="json" />
          </div>
        )}
      </div>
    </div>
  );
}

// Section wrapper component
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DocsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('getting-started');

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Image
                  src="/logo.svg"
                  alt="StatusFlow Logo"
                  width={160}
                  height={40}
                  priority
                />
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </Link>
              <Link href="/#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </Link>
              <span className="text-blue-600 font-medium">Docs</span>
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-3">
              <Link href="/" className="block text-gray-600 hover:text-gray-900">Home</Link>
              <Link href="/#features" className="block text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="/#pricing" className="block text-gray-600 hover:text-gray-900">Pricing</Link>
              <span className="block text-blue-600 font-medium">Docs</span>
              <Link href="/login" className="block text-gray-600 hover:text-gray-900">Sign In</Link>
              <Link href="/signup" className="block px-4 py-2 bg-blue-600 text-white rounded-lg text-center">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-8 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-sm text-blue-700 font-medium mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Documentation
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">StatusFlow API Reference</h1>
            <p className="text-lg text-gray-600">
              Everything you need to integrate StatusFlow into your applications. Monitor your services,
              receive instant alerts, and track uptime metrics programmatically.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                API v1.0 - Stable
              </div>
              <div className="text-sm text-gray-500">
                Base URL: <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">https://api.statusflow.dev</code>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="#getting-started"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Quick Start Guide
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="#key-concepts"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Learn Key Concepts
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden sticky top-16 z-40 bg-white border-b border-gray-200">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-gray-700 hover:bg-gray-50"
        >
          <span className="font-medium">
            {sections.find((s) => s.id === activeSection)?.title || 'Navigation'}
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {sidebarOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg max-h-96 overflow-y-auto">
            <nav className="py-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    section.indent ? 'pl-8' : ''
                  } ${
                    activeSection === section.id
                      ? 'text-blue-600 bg-blue-50 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-[250px_1fr] lg:gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                    section.indent ? 'pl-6' : ''
                  } ${
                    activeSection === section.id
                      ? 'text-blue-600 bg-blue-50 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="min-w-0">
            {/* Introduction */}
            <Section id="introduction" title="Introduction">
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 mb-6 text-lg">
                  <strong>StatusFlow</strong> is a real-time uptime monitoring platform designed for developers and teams
                  who need reliable visibility into their websites, APIs, and services. Whether you&apos;re running a
                  SaaS application, an e-commerce site, or internal microservices, StatusFlow helps you detect
                  downtime before your users do.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Monitoring</h3>
                    <p className="text-sm text-gray-600">
                      Monitor any HTTP/HTTPS endpoint with configurable intervals from 10 seconds to 1 hour.
                      Get instant visibility into uptime, response times, and status codes.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 border border-green-100">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Alerts</h3>
                    <p className="text-sm text-gray-600">
                      Get notified immediately when something goes wrong via Email, Slack, SMS, or custom webhooks.
                      Configure alert rules based on downtime, latency, or SSL expiry.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-100">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Analytics</h3>
                    <p className="text-sm text-gray-600">
                      Track uptime percentages, average and P95 response times, and historical trends.
                      Generate reports to share with stakeholders or for compliance purposes.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-6 border border-orange-100">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Developer-First API</h3>
                    <p className="text-sm text-gray-600">
                      Full REST API to automate monitor management, integrate with CI/CD pipelines,
                      or build custom dashboards. Self-host or use our managed service.
                    </p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Who is StatusFlow for?</h3>
                <ul className="space-y-2 text-gray-600 mb-6">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Indie developers</strong> who want simple, affordable uptime monitoring for their side projects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Startups and small teams</strong> that need reliable monitoring without enterprise complexity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong>DevOps engineers</strong> who want to integrate monitoring into their automation workflows</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Privacy-conscious organizations</strong> that want to self-host their monitoring infrastructure</span>
                  </li>
                </ul>
              </div>
            </Section>

            {/* Key Concepts */}
            <Section id="key-concepts" title="Key Concepts">
              <p className="text-gray-600 mb-6">
                Before diving into the API, it&apos;s helpful to understand the core concepts that make up StatusFlow.
                These building blocks work together to provide comprehensive monitoring capabilities.
              </p>

              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Monitors</h3>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-gray-600 mb-3">
                      A <strong>Monitor</strong> represents a single endpoint (URL) that you want to track. Each monitor
                      periodically sends HTTP requests to your endpoint and records the response status, time, and any errors.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm">
                      <p className="font-medium text-gray-700 mb-2">Monitor properties include:</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600">
                        <li><code className="bg-gray-200 px-1 rounded">url</code> - The endpoint to check</li>
                        <li><code className="bg-gray-200 px-1 rounded">interval</code> - How often to check (10s - 1h)</li>
                        <li><code className="bg-gray-200 px-1 rounded">httpMethod</code> - GET, POST, PUT, etc.</li>
                        <li><code className="bg-gray-200 px-1 rounded">timeout</code> - Max wait time (1-30 seconds)</li>
                        <li><code className="bg-gray-200 px-1 rounded">headers</code> - Custom request headers</li>
                        <li><code className="bg-gray-200 px-1 rounded">body</code> - Request body for POST/PUT</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Alert Rules</h3>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-gray-600 mb-3">
                      <strong>Alert Rules</strong> define the conditions that trigger notifications. You can create rules
                      for different scenarios and assign them to specific monitors or apply them globally.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                        <p className="font-medium text-red-800">DOWNTIME</p>
                        <p className="text-red-600 text-xs mt-1">Trigger when endpoint is unreachable or returns error status</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                        <p className="font-medium text-orange-800">LATENCY</p>
                        <p className="text-orange-600 text-xs mt-1">Trigger when response time exceeds threshold</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <p className="font-medium text-purple-800">STATUS_CODE</p>
                        <p className="text-purple-600 text-xs mt-1">Trigger on specific HTTP status codes (4xx, 5xx)</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <p className="font-medium text-blue-800">SSL_EXPIRY</p>
                        <p className="text-blue-600 text-xs mt-1">Trigger before SSL certificate expires</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Notification Channels</h3>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-gray-600 mb-3">
                      <strong>Notification Channels</strong> are the delivery methods for your alerts. Configure where and
                      how you want to receive notifications when alert rules are triggered.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        Email
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                        Webhook
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        SMS
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                        </svg>
                        Slack
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Incidents</h3>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-gray-600 mb-3">
                      An <strong>Incident</strong> is created automatically when a monitor detects a problem. Incidents
                      track the full lifecycle from detection to resolution, including duration and any actions taken.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        <span className="text-gray-600">Triggered</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                        <span className="text-gray-600">Acknowledged</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        <span className="text-gray-600">Resolved</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <strong>How it all connects:</strong> You create <em>Monitors</em> to watch your endpoints.
                    When a check fails the conditions in your <em>Alert Rules</em>, an <em>Incident</em> is created
                    and notifications are sent through your configured <em>Notification Channels</em>.
                  </div>
                </div>
              </div>
            </Section>

            {/* Getting Started */}
            <Section id="getting-started" title="Getting Started">
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 mb-6">
                  Ready to start monitoring? Follow these steps to set up your first monitor in under 5 minutes.
                  The StatusFlow API is RESTful, uses JSON for request/response bodies, and requires JWT authentication
                  for most endpoints.
                </p>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-100 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    5-Minute Quick Start
                  </h3>
                  <ol className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span><strong>Sign up</strong> - Create an account to get your API credentials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span><strong>Log in</strong> - Authenticate to receive your JWT access token</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span><strong>Create a monitor</strong> - Add your first endpoint to track</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      <span><strong>Set up alerts</strong> - Configure how you want to be notified</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                      <span><strong>Done!</strong> - StatusFlow will now monitor your endpoint 24/7</span>
                    </li>
                  </ol>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Base URL</h3>
                <CodeBlock code="https://api.statusflow.dev" language="bash" />

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Quick Start</h3>
                <p className="text-gray-600 mb-4">
                  To get started with the API, you need to create an account and obtain an access token.
                  Here&apos;s a quick example:
                </p>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">1. Create an account</p>
                    <CodeBlock
                      language="bash"
                      code={`curl -X POST https://api.statusflow.dev/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"email": "you@example.com", "password": "SecurePass123"}'`}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">2. Login to get your access token</p>
                    <CodeBlock
                      language="bash"
                      code={`curl -X POST https://api.statusflow.dev/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "you@example.com", "password": "SecurePass123"}'`}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">3. Create your first monitor</p>
                    <CodeBlock
                      language="bash"
                      code={`curl -X POST https://api.statusflow.dev/monitors \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My API Health Check",
    "url": "https://api.myapp.com/health",
    "interval": 60,
    "httpMethod": "GET"
  }'`}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">4. Check your monitor status</p>
                    <CodeBlock
                      language="bash"
                      code={`curl https://api.statusflow.dev/monitors \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
                    />
                  </div>
                </div>

                <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Example: Monitor a Production API</h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    Here&apos;s a complete example that creates a monitor for your production API, sets up a downtime alert,
                    and configures email notifications:
                  </p>
                  <CodeBlock
                    language="bash"
                    code={`# 1. Create a monitor for your API
curl -X POST https://api.statusflow.dev/monitors \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production API",
    "url": "https://api.myapp.com/health",
    "interval": 30,
    "httpMethod": "GET",
    "timeout": 5000,
    "maxConsecutiveFailures": 3
  }'

# Response: { "success": true, "data": { "id": "mon_abc123", ... } }

# 2. Create an alert rule for downtime
curl -X POST https://api.statusflow.dev/alerts/rules \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production Downtime Alert",
    "type": "DOWNTIME",
    "severity": "CRITICAL",
    "monitorId": "mon_abc123",
    "conditions": { "consecutiveFailures": 3 },
    "channels": { "email": true }
  }'

# That's it! You'll now receive email alerts if your API goes down.`}
                  />
                </div>
              </div>
            </Section>

            {/* Authentication */}
            <Section id="authentication" title="Authentication">
              <p className="text-gray-600 mb-6">
                StatusFlow uses JWT (JSON Web Tokens) for authentication. After logging in, you receive
                an access token that must be included in the <code className="bg-gray-100 px-1 py-0.5 rounded">Authorization</code> header
                for all authenticated requests.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <strong>Token Format:</strong> Include your token in the Authorization header as{' '}
                    <code className="bg-blue-100 px-1 py-0.5 rounded">Bearer YOUR_TOKEN</code>
                  </div>
                </div>
              </div>

              <Endpoint
                method="POST"
                path="/auth/signup"
                description="Create a new user account"
                auth={false}
                requestBody={`{
  "email": "user@example.com",
  "password": "SecurePass123"
}`}
                responseExample={`{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "createdAt": "2025-01-15T10:30:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}`}
              />

              <Endpoint
                method="POST"
                path="/auth/login"
                description="Authenticate and receive an access token"
                auth={false}
                requestBody={`{
  "email": "user@example.com",
  "password": "SecurePass123"
}`}
                responseExample={`{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}`}
              />

              <Endpoint
                method="GET"
                path="/auth/me"
                description="Get the currently authenticated user's information"
                auth={true}
                responseExample={`{
  "success": true,
  "data": {
    "id": "uuid-here",
    "email": "user@example.com",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}`}
              />
            </Section>

            {/* Monitors */}
            <Section id="monitors" title="Monitors">
              <p className="text-gray-600 mb-6">
                Monitors are the core resource in StatusFlow. Each monitor represents a URL endpoint
                that you want to track for uptime and performance.
              </p>

              <Endpoint
                method="GET"
                path="/monitors"
                description="List all monitors for the authenticated user"
                auth={true}
                responseExample={`{
  "success": true,
  "data": [
    {
      "id": "mon_abc123",
      "name": "Production API",
      "url": "https://api.example.com/health",
      "interval": 60,
      "httpMethod": "GET",
      "status": "up",
      "paused": false,
      "lastCheckedAt": "2025-01-15T10:30:00Z",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}`}
              />

              <Endpoint
                method="POST"
                path="/monitors"
                description="Create a new monitor"
                auth={true}
                requestBody={`{
  "name": "Production API",
  "url": "https://api.example.com/health",
  "interval": 60,
  "httpMethod": "GET",
  "timeout": 5000,
  "headers": {
    "X-Custom-Header": "value"
  },
  "body": null,
  "maxLatencyMs": 2000,
  "maxConsecutiveFailures": 3
}`}
                responseExample={`{
  "success": true,
  "data": {
    "id": "mon_abc123",
    "name": "Production API",
    "url": "https://api.example.com/health",
    "interval": 60,
    "httpMethod": "GET",
    "timeout": 5000,
    "paused": false,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}`}
              />

              <Endpoint
                method="GET"
                path="/monitors/:id"
                description="Get a single monitor by ID"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The monitor ID' },
                ]}
                responseExample={`{
  "success": true,
  "data": {
    "id": "mon_abc123",
    "name": "Production API",
    "url": "https://api.example.com/health",
    "interval": 60,
    "status": "up",
    "uptime": 99.95,
    "avgResponseTime": 145,
    "lastCheckedAt": "2025-01-15T10:30:00Z"
  }
}`}
              />

              <Endpoint
                method="PATCH"
                path="/monitors/:id"
                description="Update a monitor's configuration"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The monitor ID' },
                ]}
                requestBody={`{
  "name": "Updated API Name",
  "interval": 30,
  "paused": false
}`}
                responseExample={`{
  "success": true,
  "data": {
    "id": "mon_abc123",
    "name": "Updated API Name",
    "interval": 30,
    "updatedAt": "2025-01-15T10:35:00Z"
  }
}`}
              />

              <Endpoint
                method="DELETE"
                path="/monitors/:id"
                description="Delete a monitor permanently"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The monitor ID' },
                ]}
                responseExample={`{
  "success": true,
  "data": null
}`}
              />

              <Endpoint
                method="PATCH"
                path="/monitors/:id/pause"
                description="Pause monitoring for this endpoint"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The monitor ID' },
                ]}
                responseExample={`{
  "success": true,
  "data": {
    "message": "Monitor paused successfully"
  }
}`}
              />

              <Endpoint
                method="PATCH"
                path="/monitors/:id/resume"
                description="Resume monitoring for a paused endpoint"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The monitor ID' },
                ]}
                responseExample={`{
  "success": true,
  "data": {
    "message": "Monitor resumed successfully"
  }
}`}
              />

              <Endpoint
                method="GET"
                path="/monitors/:id/stats"
                description="Get statistics for a specific monitor"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The monitor ID' },
                ]}
                responseExample={`{
  "success": true,
  "data": {
    "uptime": 99.95,
    "avgResponseTime": 145,
    "p95ResponseTime": 280,
    "totalChecks": 10000,
    "successfulChecks": 9995,
    "failedChecks": 5
  }
}`}
              />

              <Endpoint
                method="GET"
                path="/monitors/:id/metrics"
                description="Get historical metrics for a monitor"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The monitor ID' },
                ]}
                queryParams={[
                  { name: 'from', type: 'string', description: 'Start date in ISO format (default: 24 hours ago)' },
                  { name: 'to', type: 'string', description: 'End date in ISO format (default: now)' },
                  { name: 'interval', type: 'string', description: 'Aggregation interval e.g., "1h", "1d" (default: "1h")' },
                ]}
                responseExample={`{
  "success": true,
  "data": {
    "metrics": [
      {
        "timestamp": "2025-01-15T10:00:00Z",
        "avgResponseTime": 142,
        "uptime": 100,
        "checks": 60
      },
      {
        "timestamp": "2025-01-15T11:00:00Z",
        "avgResponseTime": 148,
        "uptime": 100,
        "checks": 60
      }
    ]
  }
}`}
              />
            </Section>

            {/* Alerts Overview */}
            <Section id="alerts" title="Alerts">
              <p className="text-gray-600 mb-6">
                The Alerts system allows you to configure rules that trigger notifications when your monitors
                detect issues. You can set up multiple notification channels and customize alert conditions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Alert Rules</h4>
                  <p className="text-sm text-gray-600">Define conditions that trigger alerts</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Notification Channels</h4>
                  <p className="text-sm text-gray-600">Email, Webhook, SMS, Slack</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Alert History</h4>
                  <p className="text-sm text-gray-600">Track and manage past alerts</p>
                </div>
              </div>
            </Section>

            {/* Alert Rules */}
            <Section id="alert-rules" title="Alert Rules">
              <p className="text-gray-600 mb-6">
                Alert rules define the conditions under which notifications are sent. You can create rules
                for downtime, latency thresholds, specific status codes, and SSL certificate expiration.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <strong>Alert Types:</strong> DOWNTIME, LATENCY, STATUS_CODE, SSL_EXPIRY
                  </div>
                </div>
              </div>

              <Endpoint
                method="GET"
                path="/alerts/rules"
                description="List all alert rules for the authenticated user"
                auth={true}
                queryParams={[
                  { name: 'monitorId', type: 'string', description: 'Filter rules by monitor ID' },
                ]}
                responseExample={`{
  "success": true,
  "data": [
    {
      "id": "rule_abc123",
      "name": "High Latency Alert",
      "type": "LATENCY",
      "severity": "HIGH",
      "enabled": true,
      "monitorId": "mon_abc123",
      "conditions": {
        "latencyThreshold": 2000
      },
      "channels": {
        "email": true,
        "webhook": {
          "enabled": true,
          "url": "https://hooks.example.com/alert"
        }
      }
    }
  ]
}`}
              />

              <Endpoint
                method="POST"
                path="/alerts/rules"
                description="Create a new alert rule"
                auth={true}
                requestBody={`{
  "name": "Downtime Alert",
  "description": "Alert when service is down",
  "type": "DOWNTIME",
  "severity": "CRITICAL",
  "enabled": true,
  "monitorId": "mon_abc123",
  "conditions": {
    "consecutiveFailures": 3
  },
  "channels": {
    "email": true,
    "webhook": {
      "enabled": true,
      "url": "https://hooks.example.com/alert",
      "headers": {
        "X-Secret": "your-secret"
      }
    }
  }
}`}
                responseExample={`{
  "success": true,
  "data": {
    "id": "rule_xyz789",
    "name": "Downtime Alert",
    "type": "DOWNTIME",
    "severity": "CRITICAL",
    "enabled": true,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}`}
              />

              <Endpoint
                method="GET"
                path="/alerts/rules/:id"
                description="Get a specific alert rule"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The alert rule ID' },
                ]}
                responseExample={`{
  "success": true,
  "data": {
    "id": "rule_abc123",
    "name": "High Latency Alert",
    "type": "LATENCY",
    "severity": "HIGH",
    "enabled": true,
    "conditions": {
      "latencyThreshold": 2000
    }
  }
}`}
              />

              <Endpoint
                method="PUT"
                path="/alerts/rules/:id"
                description="Update an alert rule"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The alert rule ID' },
                ]}
                requestBody={`{
  "name": "Updated Alert Name",
  "severity": "MEDIUM",
  "enabled": false
}`}
                responseExample={`{
  "success": true,
  "data": {
    "id": "rule_abc123",
    "name": "Updated Alert Name",
    "severity": "MEDIUM",
    "enabled": false,
    "updatedAt": "2025-01-15T10:35:00Z"
  }
}`}
              />

              <Endpoint
                method="DELETE"
                path="/alerts/rules/:id"
                description="Delete an alert rule"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The alert rule ID' },
                ]}
                responseExample={`{
  "success": true,
  "data": null
}`}
              />
            </Section>

            {/* Notification Channels */}
            <Section id="notification-channels" title="Notification Channels">
              <p className="text-gray-600 mb-6">
                Notification channels define how you receive alerts. StatusFlow supports multiple channel
                types including Email, Webhook, SMS, and Slack.
              </p>

              <Endpoint
                method="GET"
                path="/alerts/channels"
                description="List all notification channels"
                auth={true}
                responseExample={`{
  "success": true,
  "data": [
    {
      "id": "chan_abc123",
      "name": "Team Email",
      "type": "EMAIL",
      "enabled": true,
      "isDefault": true,
      "configuration": {
        "emailAddresses": ["team@example.com", "ops@example.com"]
      }
    },
    {
      "id": "chan_xyz789",
      "name": "Slack Ops",
      "type": "SLACK",
      "enabled": true,
      "configuration": {
        "slackWebhookUrl": "https://hooks.slack.com/...",
        "slackChannel": "#ops-alerts"
      }
    }
  ]
}`}
              />

              <Endpoint
                method="POST"
                path="/alerts/channels"
                description="Create a new notification channel"
                auth={true}
                requestBody={`{
  "name": "Webhook Integration",
  "type": "WEBHOOK",
  "enabled": true,
  "isDefault": false,
  "configuration": {
    "webhookUrl": "https://api.example.com/webhooks/alerts",
    "webhookHeaders": {
      "Authorization": "Bearer secret"
    },
    "webhookMethod": "POST"
  },
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00",
    "timezone": "America/New_York",
    "daysOfWeek": [0, 6]
  }
}`}
                responseExample={`{
  "success": true,
  "data": {
    "id": "chan_new123",
    "name": "Webhook Integration",
    "type": "WEBHOOK",
    "enabled": true,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}`}
              />

              <Endpoint
                method="PUT"
                path="/alerts/channels/:id"
                description="Update a notification channel"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The channel ID' },
                ]}
                requestBody={`{
  "name": "Updated Channel Name",
  "enabled": false
}`}
                responseExample={`{
  "success": true,
  "data": {
    "id": "chan_abc123",
    "name": "Updated Channel Name",
    "enabled": false,
    "updatedAt": "2025-01-15T10:35:00Z"
  }
}`}
              />

              <Endpoint
                method="DELETE"
                path="/alerts/channels/:id"
                description="Delete a notification channel"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The channel ID' },
                ]}
                responseExample={`{
  "success": true,
  "data": null
}`}
              />

              <Endpoint
                method="POST"
                path="/alerts/channels/:id/test"
                description="Send a test notification through a channel"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The channel ID' },
                ]}
                responseExample={`{
  "success": true,
  "data": {
    "message": "Test notification sent successfully"
  }
}`}
              />
            </Section>

            {/* Alert History */}
            <Section id="alert-history" title="Alert History">
              <p className="text-gray-600 mb-6">
                View and manage past alerts. You can acknowledge alerts to indicate you&apos;re working on them,
                and resolve them when the issue is fixed.
              </p>

              <Endpoint
                method="GET"
                path="/alerts/history"
                description="List alert history records"
                auth={true}
                queryParams={[
                  { name: 'monitorId', type: 'string', description: 'Filter by monitor ID' },
                  { name: 'status', type: 'string', description: 'Filter by status (triggered, acknowledged, resolved)' },
                  { name: 'from', type: 'string', description: 'Start date in ISO format' },
                  { name: 'to', type: 'string', description: 'End date in ISO format' },
                ]}
                responseExample={`{
  "success": true,
  "data": [
    {
      "id": "alert_abc123",
      "ruleId": "rule_xyz789",
      "monitorId": "mon_abc123",
      "status": "triggered",
      "severity": "CRITICAL",
      "message": "Service is down",
      "triggeredAt": "2025-01-15T10:30:00Z",
      "acknowledgedAt": null,
      "resolvedAt": null
    }
  ]
}`}
              />

              <Endpoint
                method="GET"
                path="/alerts/history/:id"
                description="Get a specific alert history record"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The alert history ID' },
                ]}
                responseExample={`{
  "success": true,
  "data": {
    "id": "alert_abc123",
    "ruleId": "rule_xyz789",
    "monitorId": "mon_abc123",
    "status": "triggered",
    "severity": "CRITICAL",
    "message": "Service is down",
    "details": {
      "statusCode": 503,
      "responseTime": null
    },
    "triggeredAt": "2025-01-15T10:30:00Z"
  }
}`}
              />

              <Endpoint
                method="PUT"
                path="/alerts/history/:id/acknowledge"
                description="Acknowledge an alert (mark as being worked on)"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The alert history ID' },
                ]}
                responseExample={`{
  "success": true,
  "data": {
    "id": "alert_abc123",
    "status": "acknowledged",
    "acknowledgedAt": "2025-01-15T10:35:00Z",
    "acknowledgedBy": "user@example.com"
  }
}`}
              />

              <Endpoint
                method="PUT"
                path="/alerts/history/:id/resolve"
                description="Resolve an alert (mark as fixed)"
                auth={true}
                pathParams={[
                  { name: 'id', type: 'string', description: 'The alert history ID' },
                ]}
                responseExample={`{
  "success": true,
  "data": {
    "id": "alert_abc123",
    "status": "resolved",
    "resolvedAt": "2025-01-15T11:00:00Z",
    "resolvedBy": "user@example.com"
  }
}`}
              />
            </Section>

            {/* Dashboard */}
            <Section id="dashboard" title="Dashboard">
              <p className="text-gray-600 mb-6">
                The Dashboard endpoints provide aggregated data and statistics across all your monitors,
                useful for building overview dashboards and status pages.
              </p>

              <Endpoint
                method="GET"
                path="/dashboard/stats"
                description="Get overall dashboard statistics"
                auth={true}
                responseExample={`{
  "success": true,
  "data": {
    "totalMonitors": 12,
    "activeMonitors": 10,
    "pausedMonitors": 2,
    "overallUptime": 99.85,
    "avgResponseTime": 156,
    "activeIncidents": 1
  }
}`}
              />

              <Endpoint
                method="GET"
                path="/dashboard/incidents"
                description="Get recent incidents"
                auth={true}
                queryParams={[
                  { name: 'limit', type: 'number', description: 'Number of incidents to return (default: 10)' },
                  { name: 'sort', type: 'string', description: 'Sort order: "latest" or "oldest" (default: "latest")' },
                ]}
                responseExample={`{
  "success": true,
  "data": [
    {
      "id": "inc_abc123",
      "monitorId": "mon_abc123",
      "monitorName": "Production API",
      "status": "ongoing",
      "startedAt": "2025-01-15T10:30:00Z",
      "endedAt": null,
      "duration": null
    }
  ]
}`}
              />

              <Endpoint
                method="GET"
                path="/dashboard/notifications"
                description="Get recent notifications"
                auth={true}
                responseExample={`{
  "success": true,
  "data": [
    {
      "id": "notif_abc123",
      "type": "alert",
      "message": "Production API is down",
      "read": false,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}`}
              />

              <Endpoint
                method="GET"
                path="/dashboard/performance-trends"
                description="Get performance trends over time"
                auth={true}
                queryParams={[
                  { name: 'hours', type: 'number', description: 'Number of hours to include (default: 24)' },
                ]}
                responseExample={`{
  "success": true,
  "data": {
    "trends": [
      {
        "timestamp": "2025-01-15T00:00:00Z",
        "avgResponseTime": 145,
        "uptime": 100
      },
      {
        "timestamp": "2025-01-15T01:00:00Z",
        "avgResponseTime": 152,
        "uptime": 100
      }
    ]
  }
}`}
              />

              <Endpoint
                method="GET"
                path="/dashboard/monitor-statuses"
                description="Get current status of all monitors"
                auth={true}
                responseExample={`{
  "success": true,
  "data": [
    {
      "id": "mon_abc123",
      "name": "Production API",
      "status": "up",
      "lastResponseTime": 142,
      "lastCheckedAt": "2025-01-15T10:30:00Z"
    },
    {
      "id": "mon_xyz789",
      "name": "Staging API",
      "status": "down",
      "lastResponseTime": null,
      "lastCheckedAt": "2025-01-15T10:30:00Z"
    }
  ]
}`}
              />
            </Section>

            {/* Reports */}
            <Section id="reports" title="Reports">
              <p className="text-gray-600 mb-6">
                Generate and export reports for your monitors. Reports include uptime statistics,
                response time metrics, and incident history.
              </p>

              <Endpoint
                method="POST"
                path="/reports/generate"
                description="Generate a report for specified monitors"
                auth={true}
                requestBody={`{
  "monitorIds": ["mon_abc123", "mon_xyz789"],
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-01-15T23:59:59Z",
  "format": "JSON"
}`}
                responseExample={`{
  "success": true,
  "data": {
    "reportId": "rep_abc123",
    "generatedAt": "2025-01-15T10:30:00Z",
    "period": {
      "start": "2025-01-01T00:00:00Z",
      "end": "2025-01-15T23:59:59Z"
    },
    "summary": {
      "totalMonitors": 2,
      "overallUptime": 99.92,
      "totalIncidents": 3,
      "avgResponseTime": 148
    },
    "monitors": [
      {
        "id": "mon_abc123",
        "name": "Production API",
        "uptime": 99.95,
        "avgResponseTime": 145,
        "incidents": 1
      }
    ]
  }
}`}
              />

              <Endpoint
                method="GET"
                path="/reports/export/csv"
                description="Export report data as CSV"
                auth={true}
                queryParams={[
                  { name: 'monitorIds', type: 'string[]', description: 'Array of monitor IDs to include' },
                  { name: 'startDate', type: 'string', description: 'Start date in ISO format', required: true },
                  { name: 'endDate', type: 'string', description: 'End date in ISO format', required: true },
                ]}
                responseExample={`Content-Type: text/csv
Content-Disposition: attachment; filename="report.csv"

monitor_id,monitor_name,timestamp,status,response_time
mon_abc123,Production API,2025-01-15T10:00:00Z,up,142
mon_abc123,Production API,2025-01-15T10:01:00Z,up,145
...`}
              />

              <Endpoint
                method="GET"
                path="/reports/export/json"
                description="Export report data as JSON"
                auth={true}
                queryParams={[
                  { name: 'monitorIds', type: 'string[]', description: 'Array of monitor IDs to include' },
                  { name: 'startDate', type: 'string', description: 'Start date in ISO format', required: true },
                  { name: 'endDate', type: 'string', description: 'End date in ISO format', required: true },
                ]}
                responseExample={`{
  "success": true,
  "data": {
    "exportedAt": "2025-01-15T10:30:00Z",
    "records": [
      {
        "monitorId": "mon_abc123",
        "monitorName": "Production API",
        "timestamp": "2025-01-15T10:00:00Z",
        "status": "up",
        "responseTime": 142
      }
    ]
  }
}`}
              />
            </Section>

            {/* Response Format */}
            <Section id="response-format" title="Response Format">
              <p className="text-gray-600 mb-6">
                All API responses follow a consistent format. This makes it easy to handle responses
                uniformly across your application.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Success Response</h3>
              <p className="text-gray-600 mb-3">
                Successful requests return a <code className="bg-gray-100 px-1 py-0.5 rounded">success: true</code> field
                along with the response data.
              </p>
              <CodeBlock
                code={`{
  "success": true,
  "data": {
    // Response data here
  }
}`}
              />

              <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Error Response</h3>
              <p className="text-gray-600 mb-3">
                Failed requests return <code className="bg-gray-100 px-1 py-0.5 rounded">success: false</code> with
                an error object containing a code and message.
              </p>
              <CodeBlock
                code={`{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "The email or password you entered is incorrect"
  }
}`}
              />

              <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Common Error Codes</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-100">
                      <th className="text-left px-4 py-3 text-gray-700 font-semibold">Code</th>
                      <th className="text-left px-4 py-3 text-gray-700 font-semibold">HTTP Status</th>
                      <th className="text-left px-4 py-3 text-gray-700 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-3 font-mono text-red-600">UNAUTHORIZED</td>
                      <td className="px-4 py-3 text-gray-600">401</td>
                      <td className="px-4 py-3 text-gray-600">Missing or invalid authentication token</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-red-600">FORBIDDEN</td>
                      <td className="px-4 py-3 text-gray-600">403</td>
                      <td className="px-4 py-3 text-gray-600">You don&apos;t have permission to access this resource</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-red-600">NOT_FOUND</td>
                      <td className="px-4 py-3 text-gray-600">404</td>
                      <td className="px-4 py-3 text-gray-600">The requested resource was not found</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-red-600">VALIDATION_ERROR</td>
                      <td className="px-4 py-3 text-gray-600">400</td>
                      <td className="px-4 py-3 text-gray-600">Request body failed validation</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-red-600">INVALID_CREDENTIALS</td>
                      <td className="px-4 py-3 text-gray-600">401</td>
                      <td className="px-4 py-3 text-gray-600">Incorrect email or password</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-red-600">EMAIL_EXISTS</td>
                      <td className="px-4 py-3 text-gray-600">409</td>
                      <td className="px-4 py-3 text-gray-600">An account with this email already exists</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-red-600">INVALID_URL</td>
                      <td className="px-4 py-3 text-gray-600">400</td>
                      <td className="px-4 py-3 text-gray-600">The provided URL is not valid or reachable</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-red-600">INTERNAL_ERROR</td>
                      <td className="px-4 py-3 text-gray-600">500</td>
                      <td className="px-4 py-3 text-gray-600">An unexpected server error occurred</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Rate Limits */}
            <Section id="rate-limits" title="Rate Limits">
              <p className="text-gray-600 mb-6">
                StatusFlow currently does not enforce rate limits on the API. However, we recommend
                implementing reasonable request patterns in your applications.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-green-800">
                    <strong>No rate limits currently enforced.</strong> Use the API freely for your monitoring needs.
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Practices</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Cache responses when possible, especially for dashboard stats and metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Use webhooks for real-time notifications instead of polling</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Implement exponential backoff for retries on failed requests</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Batch operations where possible (e.g., get all monitors in one request)</span>
                </li>
              </ul>
            </Section>

            {/* Footer CTA */}
            <div className="mt-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">Ready to get started?</h2>
              <p className="text-blue-100 mb-6">
                Create your free account and start monitoring your services in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Get Started Free
                </Link>
                <a
                  href="https://github.com/statusflow/statusflow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  View on GitHub
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-white.svg"
                alt="StatusFlow Logo"
                width={140}
                height={32}
                className="brightness-0 invert"
              />
            </div>
            <div className="text-sm">
              © 2025 StatusFlow. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
              <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
              <span className="text-white">Docs</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
