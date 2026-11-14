// Leitura pública de uma mesa para o overlay do OBS (sem login).
// As regras do Firestore liberam a leitura de salas/{id} e salas/{id}/painel para quem
// tem o código da mesa; as fichas completas (membros) continuam privadas.
import { db, fs } from './fb.js';

export function ouvirSalaPublica(id, cb, erro) {
  return fs.onSnapshot(fs.doc(db, 'salas', id), (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null), erro);
}
export function ouvirPainel(id, cb, erro) {
  return fs.onSnapshot(fs.collection(db, 'salas', id, 'painel'), (s) => {
    cb(s.docs.map((d) => {
      const x = d.data();
      return { uid: d.id, ...x, updatedAt: x.updatedAt && x.updatedAt.toMillis ? x.updatedAt.toMillis() : null };
    }));
  }, erro);
}
