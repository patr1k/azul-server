# Azul Game Server

![Azul](https://github.com/patr1k/azul-server/blob/main/resources/azul.jpg?raw=true)

This Deno application manages Azul game state, turn flow, and rules enforcement.
It is intended to provide the game logic for an online multiplayer Azul game.

## Overview

Clients connect via TCP and communicate with the server using a synchronous JSON 
message protocol. After connecting, clients have the option to join an existing game 
or host a new one. Games are identified by a 6 character case-insensitive 
alpha-numeric string. The game can only be started by the host, and only when there 
are between 2 and 4 players in the game.

## Message Protocol

All JSON messages are required to have a key named "@", which identifies the message
type. Valid message types are listed below. Before being transmitted, all messages
are prefixed with a 16-bit (big-endian) unsigned integer which specifies the length 
of the corresponding JSON message.

For example:

`{"@":"Quit"}`

will be encoded as:

`Uint8Array(0x00, 0x0C, 0x7B, 0x22, 0x40, 0x22, 0x3A, 0x22, 0x51, 0x75, 0x69, 0x74, 0x22, 0x7D)`

### Message Types

**Server Messages**
- GameCreated
- GameJoined
- GameNotFound
- GameIsFull
- PlayerJoined
- GameStarted
- PlayerTurn
- PlayerResigned
- RulesViolation
- GameEnded

**Client Messages**
- CreateGame
- JoinGame
- StartGame
- PlayHand
- Quit

### Misc Notes

| Tile Enum   | Tile Image     |
| ----------- | -------------- |
| R           | ![Red](https://github.com/patr1k/azul-server/blob/main/resources/tile_red.png?raw=true) |
| B           | ![Blue](https://github.com/patr1k/azul-server/blob/main/resources/tile_blue.png?raw=true) |
| Y           | ![Yellow](https://github.com/patr1k/azul-server/blob/main/resources/tile_yellow.png?raw=true) |
| W           | ![White](https://github.com/patr1k/azul-server/blob/main/resources/tile_white.png?raw=true) |
| K           | ![Black](https://github.com/patr1k/azul-server/blob/main/resources/tile_black.png?raw=true) |

Factory 0 = Center Area

Queue 0 = Tray