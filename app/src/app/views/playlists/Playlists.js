import React, { useState, useEffect } from "react";
import "./Playlists.css";

import axios from "axios";
import { Redirect } from "react-router-dom";

import { Button, PlaylistCard } from "./../../components";
import { useToast } from "../../../hooks";
import { getRoute, api } from "../../../utils/api";
import { SpotifyQueryParams } from "../../../hooks";

function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [showSuccess, showError, renderToast] = useToast();
  const [willRedirectBase, redirectBase] = useState(false);

  let spotifyParams = SpotifyQueryParams();

  useEffect(() => {
    getPlaylists();
  }, []);

  useEffect(() => {
    // Check if we're currently in a redirect from adding to spotify
    if (playlists.length > 0) {
      checkAddSpotify();
      // Remove the auth URL from spotify so we don't duplicate playlists when we add them from a redirect
      redirectBase(true);
    }
  }, [playlists]);

  useEffect(() => {
    if (willRedirectBase) {
      redirectBase(false);
    }
  }, [willRedirectBase]);

  function checkAddSpotify() {
    // If we're coming from a spotify redirect, we need to add the playlist given in the state
    if (spotifyParams.fromSpotifyRedirect) {
      localStorage.setItem("spotifyAuth", JSON.stringify(spotifyParams));
      localStorage.setItem("lastSpotify", new Date().getTime());
      addToSpotify(spotifyParams.state);
    }
  }

  function addToSpotify(playlistId) {
    // If we get here, we have our valid access token (within time limit)
    getSpotifyUserId(playlistId);
  }

  function getPlaylists() {
    getRoute(api.playlists)
      .then(function (response) {
        showSuccess("funky and fresh");
        console.log(response);
        setPlaylists(response.data.playlists);
      })
      .catch(function (error) {
        showError("Unable to retrieve playlists");
      });
  }

  function renderCards() {
    if (playlists.length === 0) {
      return [1, 2, 3, 4, 5, 6].map(function (playlist, index) {
        return <PlaylistCard skeletonPulse={true} key={index} />;
      });
    } else {
      return playlists.map(function (playlist, index) {
        return (
          <PlaylistCard
            playlist={playlist}
            addToSpotify={addToSpotify}
            key={index}
          />
        );
      });
    }
  }

  function getSpotifyUserId(playlistId) {
    let spotifyAuth = JSON.parse(localStorage.getItem("spotifyAuth"));
    axios
      .get(api.spotifyUser, {
        headers: { Authorization: `Bearer ${spotifyAuth.access_token}` },
      })
      .then(function (response) {
        console.log(response);
        createPlaylist(playlistId, response.data.id);
      })
      .catch(function (error) {
        console.log(error);
        showError("Error getting spotify user");
      });
  }

  function createPlaylist(playlistId, spotifyUserId) {
    let spotifyAuth = JSON.parse(localStorage.getItem("spotifyAuth"));
    let playlist = getPlaylist(playlistId);
    axios
      .post(
        api.spotifyPlaylist.replace("{}", spotifyUserId),
        {
          name: playlist.name,
          description:
            "Playlist generated by Lasse Nordahl and Zachary Pinto's CS122B Project",
        },
        {
          headers: { Authorization: `Bearer ${spotifyAuth.access_token}` },
        }
      )
      .then(function (response) {
        console.log(response);
        addTracksToPlaylist(playlist, response.data.id);
      })
      .catch(function (error) {
        console.log(error);
        showError("Error creating playlist");
      });
  }

  function addTracksToPlaylist(playlist, newPlaylistId) {
    let spotifyAuth = JSON.parse(localStorage.getItem("spotifyAuth"));
    axios
      .post(
        api.spotifyPlaylistTracks.replace("{}", newPlaylistId) +
          "?uris=" +
          playlist.tracks
            .map(function (track) {
              return "spotify:track:" + track.id;
            })
            .join(","),
        {},
        {
          headers: { Authorization: `Bearer ${spotifyAuth.access_token}` },
        }
      )
      .then(function (response) {
        console.log(response);
        showSuccess("Successfully created playlist");
      })
      .catch(function (error) {
        console.log(error);
        showError("Error adding tracks to playlist");
      });
  }

  function getPlaylist(id) {
    console.log(playlists);
    for (let i = 0; i < playlists.length; i++) {
      if (playlists[i].id === parseInt(id)) {
        return playlists[i];
      }
    }
    return "";
  }

  function formatSpotifyPlaylist(playlistId) {
    if (playlists.length === 0) {
      return null;
    }
  }

  return (
    <div className="playlists">
      {renderToast()}
      {willRedirectBase ? <Redirect to="/app/user/playlists/" /> : null}
      <div className="playlists-content">
        <div className="content-view-search">
          <input></input>
          <div style={{ width: "48px" }}></div>
          <Button isPrimary={true}>Search</Button>
        </div>
        {renderCards()}
      </div>
    </div>
  );
}

export default Playlists;
