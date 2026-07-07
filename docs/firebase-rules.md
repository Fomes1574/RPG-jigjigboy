# Regras recomendadas do Firebase Realtime Database

Estas regras assumem que todos os dados do jogo ficam dentro do prefixo `demo`.

> Ajuste conforme necessário no Firebase Console. As regras protegem escrita para usuários autenticados, vinculam jogadores às próprias fichas via `authProfiles/{uid}` e permitem que o Mestre gerencie o estado global.

```json
{
  "rules": {
    "demo": {
      ".read": false,
      ".write": false,

      "authProfiles": {
        "$uid": {
          ".read": "auth != null && (auth.uid === $uid || root.child('demo/authProfiles/' + auth.uid + '/role').val() === 'master')",
          ".write": "auth != null && auth.uid === $uid && (!data.exists() || data.child('role').val() === newData.child('role').val())"
        }
      },

      "usernames": {
        "$usernameKey": {
          ".read": "auth != null",
          ".write": "auth != null && !data.exists() && newData.child('uid').val() === auth.uid"
        }
      },

      "fichaLocks": {
        "$fichaId": {
          ".read": "auth != null",
          ".write": "auth != null && (!data.exists() || root.child('demo/authProfiles/' + auth.uid + '/role').val() === 'master')"
        }
      },

      "master": {
        ".read": "auth != null",
        ".write": "auth != null && (!data.exists() || root.child('demo/authProfiles/' + auth.uid + '/role').val() === 'master')"
      },

      "fichas": {
        "$fichaId": {
          ".read": "auth != null && (root.child('demo/authProfiles/' + auth.uid + '/role').val() === 'master' || root.child('demo/authProfiles/' + auth.uid + '/fichaId').val() === $fichaId)",
          ".write": "auth != null && (root.child('demo/authProfiles/' + auth.uid + '/role').val() === 'master' || root.child('demo/authProfiles/' + auth.uid + '/fichaId').val() === $fichaId)"
        }
      },

      "fotos": {
        "$fichaId": {
          ".read": "auth != null && (root.child('demo/authProfiles/' + auth.uid + '/role').val() === 'master' || root.child('demo/authProfiles/' + auth.uid + '/fichaId').val() === $fichaId)",
          ".write": "auth != null && (root.child('demo/authProfiles/' + auth.uid + '/role').val() === 'master' || root.child('demo/authProfiles/' + auth.uid + '/fichaId').val() === $fichaId)"
        }
      },

      "lista_monstros": {
        ".read": "auth != null",
        ".write": "auth != null && root.child('demo/authProfiles/' + auth.uid + '/role').val() === 'master'"
      },

      "hordas": {
        ".read": "auth != null",
        ".write": "auth != null && root.child('demo/authProfiles/' + auth.uid + '/role').val() === 'master'"
      },

      "estado_combate": {
        ".read": "auth != null",
        ".write": "auth != null && root.child('demo/authProfiles/' + auth.uid + '/role').val() === 'master'"
      }
    }
  }
}
```
