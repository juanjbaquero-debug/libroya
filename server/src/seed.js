import bcrypt from "bcryptjs";
import { loadEnv } from "./loadEnv.js";
import { connectDb } from "./db.js";
import { User } from "./models/User.js";
import { Book } from "./models/Book.js";
import mongoose from "mongoose";

loadEnv();

const books = [
  {
    title: "El murmullo del café",
    author: "Elena Vargas",
    description:
      "Una novela sobre una librería de barrio que abre de madrugada y las personas que llegan buscando algo más que un libro.",
    category: "Ficción",
    price: 12.99,
    image: "https://placehold.co/600x800/1c1915/f4efe6?text=Murmullo",
    stock: 25,
    active: true,
  },
  {
    title: "Algoritmos con calma",
    author: "Mateo Ruiz",
    description:
      "Una guía clara para entender estructuras de datos y complejidad sin perder el hilo, con ejemplos cotidianos.",
    category: "Tecnología",
    price: 24.5,
    image: "https://placehold.co/600x800/3f4a3c/f4efe6?text=Algoritmos",
    stock: 18,
    active: true,
  },
  {
    title: "La cocina de los domingos",
    author: "Ana Beltrán",
    description:
      "Recetas para compartir en casa, con listas cortas de ingredientes y el tiempo real que toma cada plato.",
    category: "Cocina",
    price: 18,
    image: "https://placehold.co/600x800/8c4a32/f4efe6?text=Cocina",
    stock: 30,
    active: true,
  },
  {
    title: "Cuentos para la hora del sueño",
    author: "Lucía Pardo",
    description:
      "Doce relatos breves para leer en voz alta, pensados para cerrar el día con calma.",
    category: "Infantil",
    price: 9.9,
    image: "https://placehold.co/600x800/245c73/f4efe6?text=Cuentos",
    stock: 40,
    active: true,
  },
  {
    title: "Mapas del silencio",
    author: "Diego Soler",
    description:
      "Un viaje a pie por pueblos pequeños y las historias que sus habitantes prefieren contar despacio.",
    category: "Ficción",
    price: 14.75,
    image: "https://placehold.co/600x800/5c4d3a/f4efe6?text=Mapas",
    stock: 12,
    active: true,
  },
  {
    title: "Bases de datos sin miedo",
    author: "Camila Ortiz",
    description:
      "Modelado, consultas y buenas prácticas para diseñar datos que se puedan mantener con el tiempo.",
    category: "Tecnología",
    price: 27,
    image: "https://placehold.co/600x800/1f3d4d/f4efe6?text=Datos",
    stock: 15,
    active: true,
  },
];

async function seed() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 6) {
    throw new Error("Define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 6 caracteres) antes de sembrar");
  }

  await connectDb();
  const passwordHash = await bcrypt.hash(password, 10);
  await User.findOneAndUpdate(
    { email },
    { name: "Administrador", email, passwordHash, role: "admin" },
    { upsert: true, new: true }
  );

  for (const book of books) {
    await Book.findOneAndUpdate({ title: book.title }, book, { upsert: true });
  }

  console.log(`Admin listo: ${email}`);
  console.log(`${books.length} libros en el catálogo`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error.message || error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
