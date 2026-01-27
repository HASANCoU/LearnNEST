import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8">
            <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand section */}
                    <div className="space-y-6">
                        <Link to="/courses" className="inline-block">
                            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                                LearnNEST
                            </span>
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                            Empowering students with premium learning experiences. Join our community and master your skills with expert-led batches.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-indigo-600 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-indigo-600 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-indigo-600 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
                            </a>
                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <h3 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Platform</h3>
                        <ul className="space-y-4">
                            <li><Link to="/courses" className="text-slate-400 hover:text-indigo-400 text-sm transition-colors">All Courses</Link></li>
                            <li><Link to="/student" className="text-slate-400 hover:text-indigo-400 text-sm transition-colors">Student Dashboard</Link></li>
                            <li><Link to="/login" className="text-slate-400 hover:text-indigo-400 text-sm transition-colors">My Learning</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Support</h3>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-slate-400 hover:text-indigo-400 text-sm transition-colors">Help Center</a></li>
                            <li><a href="#" className="text-slate-400 hover:text-indigo-400 text-sm transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="text-slate-400 hover:text-indigo-400 text-sm transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>

                    {/* Newsletter/Contact */}
                    <div>
                        <h3 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Stay Updated</h3>
                        <p className="text-slate-500 text-xs mb-4">Get notified about new courses and features.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Email address"
                                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 flex-1"
                            />
                            <button className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-xs">
                        © {new Date().getFullYear()} LearnNEST Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Designed by Mehedi Hasan</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
