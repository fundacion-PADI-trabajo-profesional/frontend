import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function register(
  email: string,
  password: string,
  nombre: string,
  apellido: string,
  rol: string
) {
  // 1. Crear usuario en Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) throw new Error(signUpError.message);

  const user = signUpData.user;

  // 2. Guardar datos extra en la tabla usuarios
  const { error: insertError } = await supabase.from("usuarios").insert({
    id: user.id,
    email,
    nombre,
    apellido,
    rol, 
  });

  if (insertError) throw new Error(insertError.message);

  return user;
}

export async function logout() {
  await supabase.auth.signOut();
}