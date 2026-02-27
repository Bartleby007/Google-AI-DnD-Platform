/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';

interface Player {
  id: string;
  name: string;
  hp: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  gold: number;
}

interface PlayerAction {
  id: string;
  player_id: string;
  action_text: string;
  turn_number: number;
  created_at?: string;
}

const API_URL = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [actions, setActions] = useState<PlayerAction[]>([]);
  const [newActionText, setNewActionText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch players on load
  useEffect(() => {
    fetchPlayers();
  }, []);

  // Fetch player details and actions when selection changes
  useEffect(() => {
    if (selectedPlayerId) {
      const player = players.find(p => p.id === selectedPlayerId);
      setSelectedPlayer(player || null);
      fetchActions(selectedPlayerId);
    } else {
      setSelectedPlayer(null);
      setActions([]);
    }
  }, [selectedPlayerId, players]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}?resource=players`);
      if (!response.ok) throw new Error('Failed to fetch players');
      const data = await response.json();
      setPlayers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchActions = async (playerId: string) => {
    try {
      const response = await fetch(`${API_URL}?resource=actions&player_id=${playerId}`);
      if (!response.ok) throw new Error('Failed to fetch actions');
      const data = await response.json();
      setActions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching actions:', err);
    }
  };

  const handleSubmitAction = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || !newActionText.trim()) return;

    // Determine next turn number (simple increment based on current actions count)
    const nextTurn = actions.length + 1;

    try {
      const response = await fetch(`${API_URL}?resource=actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: selectedPlayerId,
          action_text: newActionText,
          turn_number: nextTurn,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit action');
      
      setNewActionText('');
      fetchActions(selectedPlayerId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit action');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Player Action Tracker</h1>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <section style={{ marginBottom: '20px' }}>
        <label htmlFor="player-select" style={{ display: 'block', marginBottom: '8px' }}>Select Player:</label>
        <select 
          id="player-select"
          value={selectedPlayerId} 
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedPlayerId(e.target.value)}
          disabled={loading}
          style={{ width: '100%', padding: '8px' }}
        >
          <option value="">-- Choose a Player --</option>
          {players.map(player => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
      </section>

      {selectedPlayer && (
        <div id="player-details">
          <section style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '4px' }}>
            <h2>Stats: {selectedPlayer.name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
              <div><strong>HP:</strong> {selectedPlayer.hp}</div>
              <div><strong>STR:</strong> {selectedPlayer.strength}</div>
              <div><strong>DEX:</strong> {selectedPlayer.dexterity}</div>
              <div><strong>INT:</strong> {selectedPlayer.intelligence}</div>
              <div><strong>Gold:</strong> {selectedPlayer.gold}</div>
            </div>
          </section>

          <section style={{ marginBottom: '20px' }}>
            <h3>Actions</h3>
            <ul id="actions-list" style={{ listStyle: 'none', padding: 0 }}>
              {actions.length === 0 ? (
                <li>No actions recorded yet.</li>
              ) : (
                actions.map(action => (
                  <li key={action.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
                    <strong>Turn {action.turn_number}:</strong> {action.action_text}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h3>New Action</h3>
            <form onSubmit={handleSubmitAction}>
              <textarea
                id="action-input"
                value={newActionText}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewActionText(e.target.value)}
                placeholder="What does the player do?"
                style={{ width: '100%', height: '80px', padding: '8px', marginBottom: '10px' }}
                required
              />
              <button 
                id="submit-action"
                type="submit" 
                style={{ padding: '10px 20px', cursor: 'pointer' }}
              >
                Submit Action
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
