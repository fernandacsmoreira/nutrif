rules_version = '2';

// Regras de segurança do Firestore
// Cole este conteúdo em: Firebase Console > Firestore Database > Regras > Publicar.
// Cada nutricionista (usuário autenticado) só acessa os próprios dados,
// guardados sob nutricionistas/{seu-uid}/...

service cloud.firestore {
  match /databases/{database}/documents {

    match /nutricionistas/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Qualquer outro caminho é bloqueado por padrão.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
