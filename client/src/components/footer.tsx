import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/attached_assets/WhatsApp Image 2025-06-13 at 17.58.11_cbc00289_1749826746862.jpg"
                alt="Doogle Online"
                className="h-8 w-8 rounded-lg"
              />
              <span className="font-bold text-lg text-primary">Doogle Online</span>
            </div>
            <p className="text-gray-600 text-sm">
              Fast, secure, and reliable currency exchange platform serving customers worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/exchange" className="text-gray-600 hover:text-primary transition-colors">
                  Start Exchange
                </Link>
              </li>
              <li>
                <Link href="/track" className="text-gray-600 hover:text-primary transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-primary transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>24/7 Customer Support</p>
              <p>Fast Response Time</p>
              <p>Secure Transactions</p>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 Doogle Online. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}