   export default async function handler(req, res) {
     // CORS headers
     res.setHeader('Access-Control-Allow-Credentials', 'true');
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
     res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
     
     if (req.method === 'OPTIONS') {
       res.status(200).end();
       return;
     }

     const { action, path, content, message, username, token } = req.body;

     if (!username || !token) {
       return res.status(401).json({ error: 'Missing credentials' });
     }

     const url = `https://api.github.com/repos/${username}/Appli-Test-camera/contents/${path}`;

     try {
       if (action === 'read') {
         // Lire un fichier
         const response = await fetch(url, {
           headers: {
             'Authorization': `token ${token}`,
             'Accept': 'application/vnd.github.v3.raw'
           }
         });

         if (response.status === 404) {
           return res.status(404).json({ data: null });
         }

         if (!response.ok) {
           return res.status(response.status).json({ error: 'Failed to read file' });
         }

         const data = await response.text();
         return res.status(200).json({ data });

       } else if (action === 'write') {
         // Écrire/mettre à jour un fichier
         // D'abord, récupérer le SHA s'il existe
         let sha = null;
         try {
           const getResponse = await fetch(url, {
             headers: {
               'Authorization': `token ${token}`,
               'Accept': 'application/vnd.github.v3+json'
             }
           });
           if (getResponse.ok) {
             const fileData = await getResponse.json();
             sha = fileData.sha;
           }
         } catch (e) {
           // Le fichier n'existe pas, c'est normal
         }

         const body = {
           message: message || `Update ${path}`,
           content: Buffer.from(content).toString('base64'),
           branch: 'main'
         };

         if (sha) {
           body.sha = sha;
         }

         const putResponse = await fetch(url, {
           method: 'PUT',
           headers: {
             'Authorization': `token ${token}`,
             'Content-Type': 'application/json'
           },
           body: JSON.stringify(body)
         });

         if (!putResponse.ok) {
           const errorData = await putResponse.text();
           return res.status(putResponse.status).json({ error: errorData });
         }

         return res.status(200).json({ success: true });
       }

       return res.status(400).json({ error: 'Invalid action' });

     } catch (error) {
       console.error('Error:', error);
       return res.status(500).json({ error: error.message });
     }
   }
