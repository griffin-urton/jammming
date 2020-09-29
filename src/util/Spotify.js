let accessToken = null;
const clientID = "4b9723dd99a34efe84c45f0861ccf870";
const redirectURI = "http://tigerchunes.surge.sh";

export const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return;
    }
    const url = window.location.href;
    if (url.match(/access_token=([^&]*)/) && url.match(/expires_in=([^&]*)/)) {
      accessToken = url.match(/access_token=([^&]*)/)[1];
      const expiresIn = url.match(/expires_in=([^&]*)/)[1];
      window.setTimeout(() => (accessToken = ""), expiresIn * 1000);
      window.history.pushState("Access Token", null, "/");
    }
    if (!accessToken & !url.match(/access_token=([^&]*)/)) {
      window.location = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
    }
  },

  async search(term) {
    this.getAccessToken();
    let tracks = [];
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?type=track&q=${term}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.ok) {
        const jsonResponse = await response.json();
        if (Object.keys(jsonResponse).length === 0) {
          return [];
        }
        tracks = Object.values(jsonResponse)[0].items.map((track) => {
          return {
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            uri: track.uri,
          };
        });
      }
    } catch (error) {
      console.log(error);
    }
    return tracks;
  },

  async savePlaylist(name, tracks) {
    if (!name & !tracks) {
      return;
    }
    this.getAccessToken();
    const headers = { Authorization: `Bearer ${accessToken}` };
    const playlistHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    let userID;
    let playlistID;
    // get user's Spotify username
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: headers,
      });
      if (response.ok) {
        const jsonResponse = await response.json();
        userID = jsonResponse.id;

        try {
          const playlistResponse = await fetch(
            `https://api.spotify.com/v1/users/${userID}/playlists`,
            {
              headers: playlistHeaders,
              method: "POST",
              body: JSON.stringify({ name: name }),
            }
          );
          if (playlistResponse.ok) {
            const playlistJson = await playlistResponse.json();
            playlistID = playlistJson.id;

            try {
              const trackResponse = fetch(
                `https://api.spotify.com/v1/playlists/${playlistID}/tracks?uris=${tracks}`,
                {
                  method: "POST",
                  headers: headers,
                }
              );
              if (trackResponse.ok) {
                const trackJson = await trackResponse.json();
                return trackJson;
              }
            } catch (error) {
              console.log("failed to add tracks", error);
            }
          }
        } catch (error) {
          console.log("playlist creation error", error);
        }
      }
    } catch (error) {
      console.log("user id error", error);
    }
  },
};
