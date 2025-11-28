import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import { Chess } from "https://esm.sh/chess.js@1.4.0";

// Input validation schema
interface MoveRequest {
  gameId: string;
  from: string;
  to: string;
  promotion?: string;
}

const validateMoveInput = (data: any): { valid: boolean; error?: string; data?: MoveRequest } => {
  if (!data.gameId || typeof data.gameId !== 'string') {
    return { valid: false, error: "Invalid game ID" };
  }
  
  if (!data.from || typeof data.from !== 'string' || !/^[a-h][1-8]$/.test(data.from)) {
    return { valid: false, error: "Invalid 'from' square" };
  }
  
  if (!data.to || typeof data.to !== 'string' || !/^[a-h][1-8]$/.test(data.to)) {
    return { valid: false, error: "Invalid 'to' square" };
  }
  
  if (data.promotion && typeof data.promotion !== 'string') {
    return { valid: false, error: "Invalid promotion piece" };
  }
  
  if (data.promotion && !/^[qrbn]$/.test(data.promotion)) {
    return { valid: false, error: "Promotion must be q, r, b, or n" };
  }
  
  return {
    valid: true,
    data: {
      gameId: data.gameId,
      from: data.from,
      to: data.to,
      promotion: data.promotion
    }
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestBody = await req.json();
    
    // Validate input
    const validation = validateMoveInput(requestBody);
    if (!validation.valid) {
      console.warn(`Invalid input from user ${user.id}:`, validation.error);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { gameId, from, to, promotion } = validation.data!;

    // Fetch current game state
    const { data: game, error: gameError } = await supabaseClient
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if game is active
    if (game.status !== "active") {
      return new Response(JSON.stringify({ error: "Game is not active" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify player is actually in this game
    const isWhite = game.white_player_id === user.id;
    const isBlack = game.black_player_id === user.id;
    
    if (!isWhite && !isBlack) {
      console.warn(`User ${user.id} attempted to move in game ${gameId} but is not a player`);
      return new Response(JSON.stringify({ error: "You are not a player in this game" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine player color
    const playerColor = isWhite ? "white" : "black";

    // Check if it's player's turn
    if (game.current_turn !== playerColor) {
      console.warn(`User ${user.id} tried to move out of turn in game ${gameId}`);
      return new Response(JSON.stringify({ error: "Not your turn" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate move with chess.js
    const chess = new Chess();
    try {
      if (game.pgn) {
        chess.loadPgn(game.pgn);
      }
    } catch (e) {
      console.error(`Failed to load PGN for game ${gameId}:`, e);
      return new Response(JSON.stringify({ error: "Game state corrupted" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the piece being moved belongs to the player
    const piece = chess.get(from as any);
    if (!piece) {
      console.warn(`User ${user.id} tried to move from empty square ${from}`);
      return new Response(JSON.stringify({ error: "No piece at source square" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pieceColor = piece.color === 'w' ? 'white' : 'black';
    if (pieceColor !== playerColor) {
      console.warn(`User ${user.id} (${playerColor}) tried to move ${pieceColor} piece`);
      return new Response(JSON.stringify({ error: "Cannot move opponent's pieces" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Attempt the move
    let move;
    try {
      move = chess.move({
        from: from as any,
        to: to as any,
        promotion: promotion || "q",
      });
    } catch (e) {
      console.warn(`Invalid move attempt by user ${user.id}:`, e);
      return new Response(JSON.stringify({ error: "Invalid move" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!move) {
      console.warn(`Chess.js rejected move by user ${user.id}: ${from}-${to}`);
      return new Response(JSON.stringify({ error: "Invalid move" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newFen = chess.fen();
    const newPgn = chess.pgn();
    const newTurn = chess.turn() === "w" ? "white" : "black";
    const moveCount = (game.move_count || 0) + 1;

    let gameStatus = game.status;
    let gameResult = game.result;

    // Check game end conditions
    if (chess.isCheckmate()) {
      gameStatus = "completed";
      gameResult = chess.turn() === "w" ? "0-1" : "1-0";
    } else if (chess.isDraw() || chess.isStalemate()) {
      gameStatus = "completed";
      gameResult = "1/2-1/2";
    }

    // Build move history
    const moveHistory = Array.isArray(game.move_history) ? game.move_history : [];
    moveHistory.push({
      from,
      to,
      promotion,
      fen: newFen,
      timestamp: new Date().toISOString(),
    });

    // Update game in database with atomic operation
    // Use .eq("current_turn", playerColor) to prevent race conditions
    const { data: updateResult, error: updateError } = await supabaseClient
      .from("games")
      .update({
        fen: newFen,
        pgn: newPgn,
        current_turn: newTurn,
        status: gameStatus,
        result: gameResult,
        move_count: moveCount,
        move_history: moveHistory,
        updated_at: new Date().toISOString(),
      })
      .eq("id", gameId)
      .eq("current_turn", playerColor) // Atomic: ensure turn hasn't changed
      .eq("status", "active") // Only update active games
      .select();

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update game" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if update affected any rows (race condition check)
    if (!updateResult || updateResult.length === 0) {
      console.warn(`Race condition detected for user ${user.id} in game ${gameId}`);
      return new Response(JSON.stringify({ error: "Game state changed, please try again" }), {
        status: 409, // Conflict
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Move successful: ${user.id} moved ${from}-${to} in game ${gameId}`);

    // If game completed, save to history
    if (gameStatus === "completed") {
      await supabaseClient.rpc("save_game_to_history", { p_game_id: gameId });
    }

    return new Response(
      JSON.stringify({
        success: true,
        fen: newFen,
        pgn: newPgn,
        turn: newTurn,
        status: gameStatus,
        result: gameResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
