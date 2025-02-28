import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-indigo-600 mb-8">
          Edmissions World CRM
        </h1>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-center justify-center">
          <Link href="/login">
            <span className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium text-lg rounded-md hover:bg-indigo-700 transition-colors cursor-pointer">
              Login
            </span>
          </Link>
          
          <Link href="/register">
            <span className="inline-block px-6 py-3 bg-white text-indigo-600 font-medium text-lg rounded-md border border-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer">
              Register
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
