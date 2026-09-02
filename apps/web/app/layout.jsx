import LanguageProvider from '../components/LanguageProvider';
import { AuthProvider } from '../components/AuthProvider';
import './globals.css';
import 'katex/dist/katex.min.css';

export const metadata = {
  title: "MCQ Master App",
  description: 'HSC ICT MCQ practice and examination portal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn" data-theme="jayed">
      <body>
        <LanguageProvider><AuthProvider>{children}</AuthProvider></LanguageProvider>
      </body>
    </html>
  );
}
