Okay so I was watching a YouTube video about cryptography and this one thing just
stuck in my head. How does a computer generate a random number if it literally
just follows instructions?

Like, a computer does what you tell it. Always. So where does the randomness come from?

Turns out its actually a really interesting rabbit hole.

## The fake random most devs use

When you call `Math.random()` in JavaScript or `rand()` in C, you are not getting
real randomness. You are getting what is called a **pseudo-random number**.

There is an algorithm under the hood that takes a starting number called a seed
and runs it through a bunch of math to produce a sequence of numbers that looks random.

The classic one is called Mersenne Twister. It has been around since 1997 and it is still
what most languages use by default.

The catch? Same seed, same output. Every single time. It is completely deterministic.
If you know the seed, you can predict every number it will ever produce.

For most things this does not matter. Shuffling a playlist, picking a random enemy spawn
location, rolling dice in a game, pseudo-random is totally fine.

But for anything security related it is kind of a disaster waiting to happen.

## Where real randomness comes from

To get actual unpredictable randomness, the computer has to cheat a little. It borrows
randomness from the physical world.

Your OS is constantly collecting what is called **entropy** from things like how long it
took between your last two keystrokes, where your mouse was at a specific microsecond,
network packet timing, and CPU temperature fluctuations.

None of these are predictable. So the OS throws all of it into a pool and uses it to
seed a much better random number generator.

On Linux this is `/dev/urandom`. On Windows it is `BCryptGenRandom`. You have probably
never thought about these but your browser uses them every time it makes an HTTPS
connection.

## Some chips just have it built in

Modern Intel and AMD processors actually have a hardware random number generator baked
right into the chip. Intel calls theirs RDRAND.

It works by measuring thermal noise, basically the tiny random electrical fluctuations
that happen at the quantum level inside the processor. Quantum mechanics is genuinely
unpredictable so the output actually is truly random.

There are also dedicated external hardware devices that measure radioactive decay to
generate random numbers. These are used by banks, governments, and apparently casinos
who are very serious about their slot machines being fair.

## The time it actually went wrong

In 2012 a group of researchers decided to scan a huge chunk of the internet and collect
public RSA encryption keys. When they compared them, they found something alarming. A ton
of keys shared prime factors with each other.

That should basically never happen if the randomness is good. What went wrong was that
the devices generating those keys, mostly routers and embedded systems, did not have
enough entropy when they booted up. So they all ended up generating similar random numbers.

The result was that millions of encryption keys could be broken. Not cracked with brute
force, just mathematically derived because the randomness was weak.

That is the kind of thing that keeps security people up at night.

## You see it more than you think

Random numbers show up everywhere once you start noticing them.

Every time you log into a website, your session token is a random number. Every time
you buy something online, the transaction ID is random. Every UUID you have ever seen
like `550e8400-e29b-41d4-a716-446655440000` is mostly random bytes formatted to look nice.

Twitter, now X, had a famous ID system called **Snowflake**. Instead of just incrementing
numbers by one for each tweet, they generated IDs using a combination of timestamp,
machine ID, and a random sequence. The result was a 64 bit number that was unique across
thousands of servers without any of them needing to talk to each other first.

Discord uses the same concept for message IDs. If you right click a message and copy
the ID, that number actually contains the timestamp of when the message was sent. You
can decode it.

MongoDB ObjectIDs work similarly. The first 4 bytes are a Unix timestamp, next 5 are
a random value tied to the machine and process, last 3 are an incrementing counter.
Looks random, but it is actually structured chaos.

The point is that a lot of systems that need to generate unique identifiers at massive
scale cannot just use a counter. Counters require coordination. Random numbers do not.
You just generate and go, and the probability of a collision is so astronomically low
that you just accept the risk and move on.

## The lottery problem

Here is a fun one. If random numbers are so hard to get right, what about lotteries?

Physical lotteries use actual ping pong balls in a machine with air blowing through them.
That is genuinely random, the chaos of airflow and ball weight and temperature in the
room all contribute. Pretty hard to predict.

But digital lotteries and online slot machines are a different story. They use software
RNGs, and in some countries these are heavily regulated and audited. There are entire
companies whose only job is to certify that a casino's RNG is actually unpredictable.

In 2017 a researcher figured out the seed pattern of a popular slot machine by filming
the screen with his phone and running it through an app. The app could predict with high
accuracy when the machine was about to pay out. He and his team made millions before
casinos caught on.

That is not hacking. That is just understanding how pseudo-random works.

## Shuffling is harder than it looks

You would think shuffling a deck of cards in code is simple. Just randomize the order.

But a standard deck has 52 cards, which means there are 52 factorial possible arrangements.
That number is so large it has 68 digits. Most PRNGs do not have enough internal state
to even represent all those possibilities, so some orderings can literally never appear
no matter how many times you shuffle.

The correct algorithm for shuffling is called **Fisher-Yates**. It has been around since
1938, originally done by hand. The modern version runs in linear time and produces a
perfectly uniform distribution if your RNG is good enough.

Early implementations of online poker sites got this wrong. Like really wrong. Some sites
used a 32 bit seed for their shuffle, which means there were only about 4 billion possible
deck orders out of the 52 factorial that actually exist. A team of players figured this
out, built a tool to predict the deck in real time, and took a lot of money before anyone
noticed.

## Random in games

Game developers think about randomness differently from security engineers. They do not
necessarily want true randomness, they want randomness that feels fair.

True random in a game can feel terrible. You can flip heads 10 times in a row with a
fair coin, but if a player misses 10 shots in a row in your game even at 50 percent
chance, they are going to think the game is broken.

So a lot of games use something called **variance reduction** or a **pseudo-random
distribution**. Dota 2 published their formula for this. Each time you fail a proc,
the probability of the next one goes up. Each time you succeed, it resets lower. The
overall average stays the same but the streaks are smoothed out.

It feels more random than actual random. Which is a strange sentence but it is true.

## What you should actually use

Honestly most developers never need to think about this. But if you are generating
anything that needs to be secret like tokens, passwords, session IDs, or encryption keys,
do not use the default random functions.

Use the crypto module instead:

```js
const { randomBytes } = require("crypto");
const token = randomBytes(32).toString("hex");
```

```python
import secrets
token = secrets.token_hex(32)
```

These pull from the OS entropy pool so they are actually unpredictable.

`Math.random()` for a game, fine. `Math.random()` for a password reset token, please no.

## So can computers actually be random?

Sort of. With hardware RNGs or enough real world entropy, yes. But most of the time
what you are looking at is a very good mathematical illusion.

Which is fine, as long as you know when the illusion is not good enough.

Random number generation is one of those things that seems trivial until you dig into
it and realize there is a whole field of research dedicated to making computers less
predictable.

Wild.
