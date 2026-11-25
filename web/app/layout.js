import { Header } from "../components/Header";
import { Providers } from "../components/Providers";
import "./globals.css";

export const metadata = {
  title: "LibroYa",
  description: "Tienda de libros electrónicos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-line px-4 py-6 text-center text-sm text-muted">
            LibroYa · libros electrónicos con entrega digital o física
          </footer>
        </Providers>
      </body>
    </html>
  );
}
