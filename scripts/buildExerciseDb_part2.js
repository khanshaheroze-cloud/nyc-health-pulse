// Part 2: Cardio, Running, Swimming, Yoga, Pilates, Barre, Boxing, Calisthenics, Functional, Stretching
// Appends to exerciseDatabase.ts

const fs = require('fs');
const path = require('path');
const OUTPUT = path.join(__dirname, '..', 'src', 'lib', 'exerciseDatabase.ts');

const exercises = [];
function add(id, name, aliases, cat, sub, pri, sec, equip, diff, track, instr, tips) {
  exercises.push({ id, name, aliases, category: cat, subcategory: sub,
    muscleGroups: { primary: pri, secondary: sec },
    equipment: equip, difficulty: diff, trackingType: track,
    instructions: instr, tips });
}

// ═══════════════════════════════════════════════════════════════════
// CARDIO — TREADMILL
// ═══════════════════════════════════════════════════════════════════
add("treadmill-run","Treadmill Run",["treadmill jog","treadmill running"],"cardio","cardio-treadmill",["cardio-system"],["quads","hamstrings","calves"],["treadmill"],"beginner","distance-duration",["Set desired speed and start walking, then increase to running pace.","Maintain upright posture with relaxed shoulders.","Land midfoot, not on heels.","Cool down by gradually reducing speed."],["Don't hold the handrails while running.","Start with shorter distances and build up."]);
add("treadmill-walk-incline","Treadmill Walk (incline)",["incline walk","incline treadmill"],"cardio","cardio-treadmill",["cardio-system","glutes"],["hamstrings","calves"],["treadmill"],"beginner","distance-duration",["Set treadmill to walking speed (2.5-3.5 mph) and incline (8-15%).","Walk with normal gait, pumping arms.","Maintain upright posture; don't lean on handrails.","Adjust incline and speed as needed."],["Great low-impact cardio that targets glutes.","The 12-3-30 protocol uses 12% incline, 3.0 speed."]);
add("treadmill-sprint-intervals","Treadmill Sprint Intervals",["treadmill HIIT","treadmill intervals"],"cardio","cardio-treadmill",["cardio-system"],["quads","hamstrings","calves","glutes"],["treadmill"],"intermediate","distance-duration",["Warm up 5 minutes at easy pace.","Sprint 20-30 seconds at high speed.","Recover 60-90 seconds at walking pace.","Repeat for 8-12 rounds."],["Use the side rails to hop on/off safely during speed changes.","Start with fewer rounds and build up."]);
add("twelve-three-thirty","12-3-30",["12 3 30","treadmill 12-3-30"],"cardio","cardio-treadmill",["cardio-system","glutes"],["hamstrings","calves"],["treadmill"],"beginner","distance-duration",["Set treadmill to 12% incline and 3.0 mph.","Walk for 30 minutes.","Maintain upright posture.","Don't hold handrails."],["Popularized on social media; effective low-impact cardio.","Start with lower incline if 12% is too challenging."]);
add("treadmill-incline-power-walk","Treadmill Incline Power Walk",["power walk treadmill","steep incline walk"],"cardio","cardio-treadmill",["cardio-system","glutes"],["hamstrings","calves","core"],["treadmill"],"beginner","distance-duration",["Set incline to 10-15% and speed to 3.5-4.0 mph.","Walk briskly with exaggerated arm swing.","Push through each step.","Maintain for 20-40 minutes."],["Higher intensity than normal incline walk.","Great glute and hamstring conditioning."]);
add("treadmill-hiit","Treadmill HIIT",["high intensity treadmill"],"cardio","cardio-treadmill",["cardio-system"],["quads","hamstrings","glutes"],["treadmill"],"intermediate","distance-duration",["Warm up 5 minutes.","Alternate 1 minute hard effort with 1 minute recovery.","Vary speed and incline each interval.","Continue for 20-30 minutes total."],["HIIT burns more calories per minute than steady state.","Keep recovery active, not standing still."]);
add("treadmill-backwards-walk","Treadmill Backwards Walk",["reverse treadmill walk","backward walking"],"cardio","cardio-treadmill",["cardio-system","quads"],["calves","core"],["treadmill"],"intermediate","distance-duration",["Set speed very low (1.0-2.0 mph).","Hold handrails and walk backward carefully.","Focus on controlled steps.","Gradually increase speed as comfortable."],["Great for knee rehab and quad activation.","Start very slowly for safety."]);

// ═══════════════════════════════════════════════════════════════════
// CARDIO — MACHINES
// ═══════════════════════════════════════════════════════════════════
add("elliptical","Elliptical",["elliptical machine","elliptical trainer"],"cardio","cardio-machine",["cardio-system"],["quads","glutes","hamstrings"],["elliptical"],"beginner","calories-duration",["Step onto machine and grip handles.","Push and pull in smooth elliptical motion.","Maintain upright posture.","Adjust resistance as needed."],["Low-impact alternative to running.","Moving arms increases calorie burn."]);
add("elliptical-hiit","Elliptical HIIT",["elliptical intervals"],"cardio","cardio-machine",["cardio-system"],["quads","glutes","hamstrings"],["elliptical"],"intermediate","calories-duration",["Warm up 5 minutes at easy resistance.","Increase resistance/speed for 30-60 second bursts.","Recover at easy pace for 60-90 seconds.","Repeat for 20-30 minutes."],["Vary resistance and incline for different intervals.","Great for those who can't run."]);
add("stairmaster","StairMaster",["stair climber","stair stepper","stairmill"],"cardio","cardio-machine",["cardio-system","glutes","quads"],["calves","hamstrings"],["stair-climber"],"intermediate","calories-duration",["Step onto machine and grip handles lightly.","Climb at steady pace pushing through full steps.","Maintain upright posture.","Adjust speed as needed."],["Don't lean heavily on handrails; defeats the purpose.","One of the best machines for calorie burn."]);
add("stairmaster-intervals","StairMaster Intervals",["stair climber HIIT"],"cardio","cardio-machine",["cardio-system","glutes","quads"],["calves","hamstrings"],["stair-climber"],"advanced","calories-duration",["Warm up 3 minutes at moderate speed.","Climb fast for 30-60 seconds.","Slow down for recovery.","Repeat for 15-20 minutes."],["Extremely challenging on the legs.","Skip steps occasionally for more glute work."]);
add("stationary-bike","Stationary Bike",["exercise bike","upright bike"],"cardio","cardio-machine",["cardio-system","quads"],["hamstrings","calves"],["stationary-bike"],"beginner","calories-duration",["Adjust seat height so slight bend at bottom of pedal stroke.","Pedal at steady cadence.","Adjust resistance for desired intensity.","Maintain good posture."],["Great low-impact cardio.","Aim for 80-100 RPM cadence."]);
add("spin-bike-intervals","Spin Bike Intervals",["spin class","indoor cycling intervals"],"cardio","cardio-machine",["cardio-system","quads"],["hamstrings","glutes","calves"],["spin-bike"],"intermediate","calories-duration",["Adjust bike fit and warm up 5 minutes.","Alternate heavy resistance climbs with fast flat sprints.","Stand out of saddle for hills.","Cool down 5 minutes."],["Excellent for leg endurance.","Match resistance to maintain 60-100 RPM."]);
add("assault-bike","Assault Bike",["air bike","Airdyne","fan bike"],"cardio","cardio-machine",["cardio-system","full-body"],["quads","shoulders","core"],["assault-bike"],"intermediate","calories-duration",["Sit on bike, grip handles, feet on pedals.","Push and pull arms while pedaling.","The harder you work, the more resistance increases.","Pace yourself or do intervals."],["One of the most demanding cardio machines.","Arms and legs work simultaneously."]);
add("recumbent-bike","Recumbent Bike",["recumbent stationary bike"],"cardio","cardio-machine",["cardio-system","quads"],["hamstrings"],["stationary-bike"],"beginner","calories-duration",["Sit in reclined seat, adjust so slight knee bend at extension.","Pedal at steady cadence.","Adjust resistance.","Maintain comfortable posture."],["Easier on the back than upright bikes.","Good for those with back issues."]);
add("rowing-machine","Rowing Machine",["erg","ergometer","rower","concept 2"],"cardio","cardio-machine",["cardio-system","back","lats"],["quads","hamstrings","biceps","core"],["rowing-machine"],"intermediate","calories-duration",["Sit on rower, strap feet in, grip handle.","Drive with legs first, then lean back, then pull arms.","Return in reverse: arms, body, legs.","Maintain steady rhythm."],["Sequence is legs-back-arms on the drive.","Keep core engaged throughout."]);
add("rowing-intervals","Rowing Intervals",["rowing HIIT","erg intervals"],"cardio","cardio-machine",["cardio-system","back","lats"],["quads","hamstrings","core"],["rowing-machine"],"intermediate","calories-duration",["Warm up 3-5 minutes at easy pace.","Row hard for 30-60 seconds (high stroke rate).","Recover at easy pace for 60-90 seconds.","Repeat for 20-30 minutes."],["Monitor your split time for consistency.","Drive hard with legs during work intervals."]);
add("ski-erg","Ski Erg",["ski ergometer","concept 2 ski"],"cardio","cardio-machine",["cardio-system","lats","core"],["triceps","shoulders"],["ski-erg"],"intermediate","calories-duration",["Stand facing machine, grip handles overhead.","Pull handles down using lats and core in skiing motion.","Hinge slightly at hips.","Return arms overhead and repeat."],["Great for upper body cardio.","Hinge at hips for more power."]);
add("versaclimber","VersaClimber",["vertical climber"],"cardio","cardio-machine",["cardio-system","full-body"],["quads","shoulders","core","glutes"],["versaclimber"],"advanced","calories-duration",["Step onto pedals and grip handles.","Climb by moving opposite arm and leg simultaneously.","Maintain steady pace.","Keep core engaged."],["Extremely high calorie burn per minute.","Full body engagement."]);
add("jacobs-ladder","Jacob's Ladder",["jacobs ladder machine","ladder climber"],"cardio","cardio-machine",["cardio-system","full-body"],["quads","core","shoulders"],["none"],"intermediate","calories-duration",["Strap belt around waist and connect to machine.","Climb the ladder at desired pace.","The faster you climb, the faster the ladder moves.","Maintain upright posture."],["Self-paced; slowing down slows the machine.","Great total body conditioning."]);
add("arc-trainer","Arc Trainer",["arc trainer machine"],"cardio","cardio-machine",["cardio-system","glutes","quads"],["hamstrings","calves"],["elliptical"],"beginner","calories-duration",["Step onto machine and grip handles.","Move in arc pattern similar to elliptical.","Adjust incline and resistance.","Maintain upright posture."],["Less stress on joints than elliptical.","Good for those with knee issues."]);

// ═══════════════════════════════════════════════════════════════════
// CARDIO — NON-MACHINE
// ═══════════════════════════════════════════════════════════════════
add("jump-rope","Jump Rope",["skipping rope","rope jumping"],"cardio","cardio-nonmachine",["cardio-system","calves"],["shoulders","core","forearms"],["jump-rope"],"beginner","duration",["Hold rope handles at hip height.","Jump with both feet, staying on balls of feet.","Use wrist rotation, not arm swinging.","Land softly with slight knee bend."],["Start with basic two-foot jumps.","Keep jumps small and efficient."]);
add("double-unders","Double Unders",["DU","double under jump rope"],"cardio","cardio-nonmachine",["cardio-system","calves"],["shoulders","core","forearms"],["jump-rope"],"advanced","bodyweight-reps",["Same stance as regular jump rope.","Jump higher than normal.","Spin rope twice under feet per jump.","Use faster wrist rotation."],["Master single unders first.","Arms stay close to sides; wrists do the work."]);
add("box-jump","Box Jump",["box jumps","plyometric box jump"],"plyometrics","cardio-nonmachine",["quads","glutes","cardio-system"],["calves","hamstrings","core"],["box"],"intermediate","bodyweight-reps",["Stand facing box at comfortable height.","Swing arms and jump onto box landing softly.","Stand fully on top.","Step down (don't jump down to save joints)."],["Land softly with bent knees.","Start with lower box and progress."]);
add("burpees","Burpees",["burpee"],"cardio","cardio-nonmachine",["cardio-system","full-body"],["chest","quads","shoulders","core"],["none"],"intermediate","bodyweight-reps",["Stand, then squat and place hands on floor.","Jump feet back to plank, do a push-up.","Jump feet to hands, stand and jump with arms overhead.","That is one rep."],["Modify by stepping instead of jumping.","Maintain good form even when tired."]);
add("battle-ropes-waves","Battle Ropes (waves)",["battle rope waves","rope slams"],"cardio","cardio-nonmachine",["cardio-system","shoulders"],["core","forearms","biceps"],["battle-ropes"],"intermediate","duration",["Grip rope ends in each hand, slight squat stance.","Alternate arms creating wave pattern.","Keep waves going to the anchor point.","Maintain for 20-40 seconds per set."],["Stay low in athletic stance.","Vary between single and double arm waves."]);
add("battle-ropes-slams","Battle Ropes (slams)",["rope slams","double wave slams"],"cardio","cardio-nonmachine",["cardio-system","shoulders","core"],["full-body"],["battle-ropes"],"intermediate","duration",["Grip both rope ends.","Raise both arms overhead.","Slam ropes down with full force.","Repeat rapidly."],["Uses more core and full body than waves.","Great for power development."]);
add("sled-push","Sled Push",["prowler push","sled sprint"],"cardio","cardio-nonmachine",["quads","glutes","cardio-system"],["calves","core","shoulders"],["sled"],"intermediate","duration",["Load sled and grip handles low or high.","Drive through legs pushing sled forward.","Take short powerful steps.","Maintain forward lean."],["Low handle = more quad emphasis.","High handle = more upright posture."]);
add("sled-pull","Sled Pull",["sled drag","prowler pull"],"cardio","cardio-nonmachine",["hamstrings","glutes","cardio-system"],["back","core"],["sled"],"intermediate","duration",["Attach rope or strap to sled, face away.","Walk or run forward dragging sled behind.","Maintain upright posture.","Can also face sled and pull hand over hand."],["Backward sled drags are great for knees.","Vary pulling methods for different muscle emphasis."]);
add("tire-flip","Tire Flip",["tire flips"],"strength","cardio-nonmachine",["full-body","glutes","back"],["quads","hamstrings","shoulders","core"],["tire"],"advanced","bodyweight-reps",["Squat down and grip under the tire.","Drive up with legs and flip tire forward.","Push tire over with hands and repeat.","Reset for each rep."],["Use legs, not back, to initiate the flip.","Start with lighter tires."]);
add("kettlebell-swing","Kettlebell Swing",["KB swing","Russian swing"],"cardio","cardio-nonmachine",["hamstrings","glutes","cardio-system"],["core","shoulders","erector-spinae"],["kettlebell"],"intermediate","weight-reps",["Stand with feet wider than hips, KB on floor ahead.","Hike KB between legs and snap hips forward.","Swing to shoulder height (Russian) or overhead (American).","Let KB swing back and repeat."],["Power from hip hinge not arms.","Keep core braced throughout."]);
add("sprints","Sprints",["outdoor sprints","sprint training"],"cardio","cardio-nonmachine",["cardio-system","quads","hamstrings","glutes"],["calves","core"],["none"],"intermediate","distance-duration",["Warm up thoroughly with jogging and dynamic stretches.","Sprint at 90-100% effort for 10-30 seconds.","Walk or jog back to start for recovery.","Repeat for 6-10 rounds."],["Full warm-up is essential to prevent hamstring injury.","Focus on powerful arm drive."]);
add("hill-sprints","Hill Sprints",["uphill sprints","hill sprint training"],"cardio","cardio-nonmachine",["cardio-system","quads","glutes","calves"],["hamstrings","core"],["none"],"advanced","distance-duration",["Find a moderate hill (6-10% grade).","Sprint up at max effort for 10-30 seconds.","Walk down for recovery.","Repeat 6-10 times."],["Hill sprints are easier on joints than flat sprinting.","The incline forces proper forward lean."]);

// ═══════════════════════════════════════════════════════════════════
// RUNNING
// ═══════════════════════════════════════════════════════════════════
add("easy-run","Easy Run",["recovery jog","easy jog","zone 2 run"],"cardio","running",["cardio-system"],["quads","hamstrings","calves","glutes"],["none"],"beginner","distance-duration",["Run at conversational pace (can hold a conversation).","Maintain relaxed form with short strides.","Breathe naturally.","Keep heart rate in zone 2 (60-70% max)."],["Should feel easy; most running should be at this effort.","Builds aerobic base."]);
add("tempo-run","Tempo Run",["threshold run","lactate threshold run"],"cardio","running",["cardio-system"],["quads","hamstrings","calves"],["none"],"intermediate","distance-duration",["Warm up 10-15 minutes at easy pace.","Run at comfortably hard pace for 20-40 minutes.","Should be able to say short phrases but not converse.","Cool down 10 minutes."],["Tempo pace is roughly half marathon race pace.","Builds lactate threshold."]);
add("interval-run","Interval Run",["track intervals","speed work","repeats"],"cardio","running",["cardio-system"],["quads","hamstrings","calves","glutes"],["none"],"intermediate","distance-duration",["Warm up 10-15 minutes.","Run hard effort intervals (200m-1600m) at target pace.","Recover with easy jog between intervals.","Cool down 10 minutes."],["Recovery should be 50-100% of interval time.","Focus on consistent pace across intervals."]);
add("fartlek","Fartlek",["fartlek run","speed play"],"cardio","running",["cardio-system"],["quads","hamstrings","calves"],["none"],"intermediate","distance-duration",["Start with easy warm-up jog.","Alternate between faster and slower segments based on feel.","Pick landmarks (next tree, next corner) for speed changes.","No set structure; go by feel."],["Swedish for 'speed play'; less structured than intervals.","Great for beginners to speed work."]);
add("long-run","Long Run",["weekly long run","endurance run"],"cardio","running",["cardio-system"],["quads","hamstrings","calves","glutes","core"],["none"],"intermediate","distance-duration",["Run at easy to moderate pace for extended duration.","Start conservatively; negative split if possible.","Fuel and hydrate for runs over 90 minutes.","Focus on time on feet, not pace."],["The cornerstone of distance running training.","Increase distance by no more than 10% per week."]);
add("recovery-run","Recovery Run",["easy recovery run","shake-out run"],"cardio","running",["cardio-system"],["quads","hamstrings","calves"],["none"],"beginner","distance-duration",["Run very slowly, even slower than easy pace.","Keep duration short (20-40 minutes).","Focus on loosening up muscles.","Heart rate should be very low."],["Run the day after a hard workout.","Should feel better after than before."]);
add("race-pace-run","Race Pace Run",["goal pace run","specific pace run"],"cardio","running",["cardio-system"],["quads","hamstrings","calves","glutes"],["none"],"intermediate","distance-duration",["Warm up 10-15 minutes.","Run at your target race pace for a set distance.","Focus on maintaining even splits.","Cool down 10 minutes."],["Builds confidence in race pace.","Use a GPS watch for pace feedback."]);
add("hill-repeats","Hill Repeats",["hill reps","hill repeat training"],"cardio","running",["cardio-system","quads","glutes","calves"],["hamstrings","core"],["none"],"intermediate","distance-duration",["Find a hill taking 60-90 seconds to climb.","Run up at hard effort.","Jog down for recovery.","Repeat 6-10 times."],["Builds running-specific strength.","Lean slightly forward on uphills."]);

// ═══════════════════════════════════════════════════════════════════
// SWIMMING
// ═══════════════════════════════════════════════════════════════════
add("freestyle","Freestyle",["front crawl","free swim"],"cardio","swimming",["cardio-system","lats","shoulders"],["core","triceps","back"],["none"],"intermediate","distance-duration",["Enter water and push off wall.","Alternate arm strokes reaching forward and pulling through water.","Flutter kick continuously.","Breathe to the side every 2-3 strokes."],["Bilateral breathing improves balance.","Keep body horizontal and streamlined."]);
add("backstroke","Backstroke",["back crawl","swimming backstroke"],"cardio","swimming",["cardio-system","back","shoulders"],["lats","core","triceps"],["none"],"intermediate","distance-duration",["Float on back, arms alternating overhead.","Pull each arm through water from overhead to hip.","Flutter kick continuously.","Keep head still, looking up."],["Rotate shoulders with each stroke.","Great for back and shoulder mobility."]);
add("breaststroke","Breaststroke",["breast stroke","swimming breaststroke"],"cardio","swimming",["cardio-system","chest","adductors"],["shoulders","glutes","core"],["none"],"intermediate","distance-duration",["Start in streamline position.","Pull arms in circular motion to chest.","Frog kick legs out and together.","Glide between strokes."],["Timing of pull and kick is crucial.","Glide phase is where speed is maintained."]);
add("butterfly","Butterfly",["fly stroke","swimming butterfly"],"cardio","swimming",["cardio-system","shoulders","chest","lats"],["core","triceps","back"],["none"],"advanced","distance-duration",["Both arms simultaneously swing overhead and pull through water.","Dolphin kick from hips (undulate entire body).","Breathe forward every 1-2 strokes.","Maintain rhythm throughout."],["Most technically demanding stroke.","Focus on the body undulation."]);
add("swim-intervals","Swim Intervals",["pool intervals","swim sprints"],"cardio","swimming",["cardio-system","full-body"],["shoulders","lats","core"],["none"],"intermediate","distance-duration",["Warm up 200-400m at easy pace.","Swim 50-100m hard with rest between.","Repeat for desired number of intervals.","Cool down 200m easy."],["Rest 15-30 seconds between short intervals.","Mix strokes for variety."]);
add("treading-water","Treading Water",["water treading"],"cardio","swimming",["cardio-system","core"],["shoulders","hip-flexors","quads"],["none"],"beginner","duration",["Float vertically in deep water.","Use eggbeater kick or scissors kick to stay afloat.","Move arms in sculling motion.","Maintain head above water."],["Great for conditioning with no impact.","Can hold weights for more challenge."]);

// ═══════════════════════════════════════════════════════════════════
// YOGA — STANDING
// ═══════════════════════════════════════════════════════════════════
add("mountain-pose","Mountain Pose",["Tadasana","standing pose"],"yoga","yoga-standing",["core"],["quads","glutes"],["yoga-mat"],"beginner","yoga-hold",["Stand with feet together or hip-width apart.","Distribute weight evenly, engage thighs.","Arms at sides, palms forward, shoulders back.","Crown of head reaches toward ceiling."],["Foundation of all standing poses.","Focus on alignment and grounding."]);
add("chair-pose","Chair Pose",["Utkatasana","fierce pose"],"yoga","yoga-standing",["quads","glutes"],["core","shoulders"],["yoga-mat"],"beginner","yoga-hold",["Stand in mountain pose.","Bend knees deeply as if sitting in a chair.","Raise arms overhead, palms facing.","Keep weight in heels."],["Knees should not pass toes.","Engage core to protect lower back."]);
add("warrior-one","Warrior I",["Virabhadrasana I","warrior 1"],"yoga","yoga-standing",["quads","hip-flexors"],["core","shoulders","glutes"],["yoga-mat"],"beginner","yoga-hold",["Step one foot back into lunge, back foot angled 45 degrees.","Bend front knee to 90 degrees.","Raise arms overhead, hips facing forward.","Ground through back heel."],["Square hips to the front.","Great for hip flexor stretching."]);
add("warrior-two","Warrior II",["Virabhadrasana II","warrior 2"],"yoga","yoga-standing",["quads","hip-flexors"],["core","shoulders","glutes"],["yoga-mat"],"beginner","yoga-hold",["Step feet wide apart, front foot forward, back foot perpendicular.","Bend front knee to 90 degrees.","Extend arms parallel to floor, gaze over front hand.","Open hips to the side."],["Front knee tracks over ankle.","Sink deeper for more challenge."]);
add("warrior-three","Warrior III",["Virabhadrasana III","warrior 3","airplane pose"],"yoga","yoga-standing",["hamstrings","glutes","core"],["quads","back","shoulders"],["yoga-mat"],"intermediate","yoga-hold",["From standing, hinge forward lifting back leg.","Body forms a T shape parallel to floor.","Extend arms forward, at sides, or back.","Keep standing leg strong."],["Engages entire posterior chain.","Fix gaze on floor for balance."]);
add("extended-side-angle","Extended Side Angle",["Utthita Parsvakonasana","side angle pose"],"yoga","yoga-standing",["obliques","quads"],["hip-flexors","shoulders","core"],["yoga-mat"],"beginner","yoga-hold",["From warrior II, rest front forearm on front thigh.","Extend top arm overhead, creating a line from back foot to fingertips.","Open chest toward ceiling.","Alternatively place bottom hand on floor."],["Keep front knee at 90 degrees.","Lengthen through the side body."]);
add("triangle-pose","Triangle",["Trikonasana","triangle pose"],"yoga","yoga-standing",["hamstrings","obliques"],["core","hip-flexors","quads"],["yoga-mat"],"beginner","yoga-hold",["Wide stance, front foot forward, back foot perpendicular.","Hinge at hip extending torso over front leg.","Place bottom hand on shin, ankle, or floor.","Extend top arm toward ceiling."],["Keep both legs straight.","Open chest and stack shoulders."]);
add("revolved-triangle","Revolved Triangle",["Parivrtta Trikonasana","twisted triangle"],"yoga","yoga-standing",["hamstrings","obliques","core"],["hip-flexors","back"],["yoga-mat"],"intermediate","yoga-hold",["Set up as for triangle but with hips squared.","Twist torso placing opposite hand outside front foot.","Extend other arm toward ceiling.","Keep both legs straight."],["Deep twist requires thoracic mobility.","Use block under hand if needed."]);
add("half-moon-pose","Half Moon",["Ardha Chandrasana","half moon balance"],"yoga","yoga-standing",["glutes","hamstrings","core"],["quads","obliques"],["yoga-mat"],"intermediate","yoga-hold",["From triangle, bend front knee and shift weight forward.","Lift back leg parallel to floor.","Place bottom hand on floor or block.","Open top arm to ceiling."],["Challenging balance pose.","Use a wall for support when learning."]);
add("tree-pose","Tree Pose",["Vrksasana","tree balance"],"yoga","yoga-standing",["core","glutes"],["quads","hip-flexors"],["yoga-mat"],"beginner","yoga-hold",["Stand on one leg.","Place other foot on inner thigh or calf (not knee).","Bring hands to prayer or overhead.","Fix gaze on a steady point."],["Never place foot on the knee joint.","Start with foot on calf and progress to thigh."]);
add("eagle-pose","Eagle Pose",["Garudasana"],"yoga","yoga-standing",["glutes","quads","core"],["shoulders","upper-back"],["yoga-mat"],"intermediate","yoga-hold",["Stand on one leg, wrap other leg over and behind.","Cross arms, wrapping forearms and bringing palms together.","Sink into the standing leg.","Keep spine tall."],["Great for shoulder and hip flexibility.","Improves concentration and balance."]);
add("dancer-pose","Dancer Pose",["Natarajasana","king dancer"],"yoga","yoga-standing",["quads","hip-flexors","core"],["shoulders","back","hamstrings"],["yoga-mat"],"intermediate","yoga-hold",["Stand on one leg, grab opposite foot behind you.","Lean forward and kick foot into hand.","Extend free arm forward.","Open chest and arch back gently."],["Deep backbend and balance pose.","Use a strap if you cannot reach your foot."]);
add("standing-forward-fold","Standing Forward Fold",["Uttanasana","forward fold"],"yoga","yoga-standing",["hamstrings","lower-back"],["calves","glutes"],["yoga-mat"],"beginner","yoga-hold",["Stand with feet together.","Hinge at hips folding torso over legs.","Let head hang, hands toward floor.","Bend knees slightly if hamstrings are tight."],["Gravity does the stretching.","Relax head and neck."]);
add("wide-legged-forward-fold","Wide-Legged Forward Fold",["Prasarita Padottanasana","wide fold"],"yoga","yoga-standing",["hamstrings","adductors"],["lower-back","calves"],["yoga-mat"],"beginner","yoga-hold",["Step feet wide apart, toes slightly inward.","Hinge at hips folding forward.","Place hands on floor or blocks.","Let head hang."],["Legs stay straight.","Great for inner thigh flexibility."]);
add("pyramid-pose","Pyramid Pose",["Parsvottanasana","intense side stretch"],"yoga","yoga-standing",["hamstrings"],["calves","core","hip-flexors"],["yoga-mat"],"intermediate","yoga-hold",["Step one foot forward, back foot at angle.","Square hips forward.","Fold over front leg with flat back.","Hands on floor, blocks, or behind back."],["Deep hamstring stretch for the front leg.","Micro-bend front knee if needed."]);
add("high-lunge","High Lunge",["crescent lunge high","high lunge pose"],"yoga","yoga-standing",["quads","hip-flexors"],["core","glutes","shoulders"],["yoga-mat"],"beginner","yoga-hold",["Step one foot far back, staying on ball of back foot.","Bend front knee to 90 degrees.","Raise arms overhead.","Keep back leg straight and strong."],["Back heel stays lifted unlike warrior I.","Great hip flexor stretch."]);
add("crescent-lunge","Crescent Lunge",["Anjaneyasana","low lunge"],"yoga","yoga-standing",["hip-flexors","quads"],["core","glutes","shoulders"],["yoga-mat"],"beginner","yoga-hold",["From standing, step one foot back into deep lunge.","Lower back knee toward floor if desired.","Raise arms overhead.","Lift chest and lengthen spine."],["Deep hip flexor opener.","Tuck tailbone slightly to deepen stretch."]);
add("humble-warrior","Humble Warrior",["devotional warrior","bowing warrior"],"yoga","yoga-standing",["hamstrings","shoulders"],["core","hip-flexors"],["yoga-mat"],"intermediate","yoga-hold",["From warrior I, interlace hands behind back.","Fold torso inside front thigh.","Reach clasped hands toward ceiling.","Crown of head toward floor."],["Deep shoulder opener.","Requires hamstring and shoulder flexibility."]);
add("goddess-pose","Goddess Pose",["Utkata Konasana","fierce angle","wide squat"],"yoga","yoga-standing",["quads","adductors","glutes"],["core","hip-flexors"],["yoga-mat"],"beginner","yoga-hold",["Wide stance, toes turned out 45 degrees.","Bend knees deeply tracking over toes.","Arms can be at goddess position or overhead.","Keep spine tall."],["Similar to a wide plie squat.","Great for inner thigh and hip opening."]);

console.log('Yoga standing: ' + exercises.length);

// ═══════════════════════════════════════════════════════════════════
// YOGA — SEATED
// ═══════════════════════════════════════════════════════════════════
add("staff-pose","Staff Pose",["Dandasana"],"yoga","yoga-seated",["core","hip-flexors"],["hamstrings","quads"],["yoga-mat"],"beginner","yoga-hold",["Sit with legs extended straight in front.","Flex feet, press thighs down.","Sit tall with spine straight, hands beside hips.","Engage core."],["Foundation of seated poses.","If hamstrings are tight, sit on a blanket."]);
add("seated-forward-fold","Seated Forward Fold",["Paschimottanasana","seated fold"],"yoga","yoga-seated",["hamstrings","lower-back"],["calves"],["yoga-mat"],"beginner","yoga-hold",["Sit with legs extended.","Hinge at hips reaching toward feet.","Keep spine long as you fold.","Hold feet, ankles, or shins."],["Don't round the back to go deeper.","Use a strap around feet if needed."]);
add("head-to-knee-pose","Head-to-Knee",["Janu Sirsasana","head to knee forward bend"],"yoga","yoga-seated",["hamstrings","lower-back"],["hip-flexors","obliques"],["yoga-mat"],"beginner","yoga-hold",["Sit with one leg extended, other foot against inner thigh.","Fold over extended leg.","Keep extended leg straight.","Switch sides."],["Don't force head to knee; focus on lengthening spine.","Slight twist adds oblique stretch."]);
add("bound-angle-pose","Bound Angle/Butterfly",["Baddha Konasana","butterfly pose","cobbler pose"],"yoga","yoga-seated",["adductors","hip-flexors"],["lower-back","glutes"],["yoga-mat"],"beginner","yoga-hold",["Sit with soles of feet together, knees out.","Hold feet and sit tall.","Gently press knees toward floor.","Fold forward for deeper stretch."],["Don't force knees down.","Excellent hip opener."]);
add("wide-angle-forward-fold","Wide-Angle Forward Fold",["Upavistha Konasana","wide angle seated fold"],"yoga","yoga-seated",["hamstrings","adductors"],["lower-back"],["yoga-mat"],"intermediate","yoga-hold",["Sit with legs spread wide.","Walk hands forward folding from hips.","Keep spine long.","Go as far as comfortable."],["Wide straddle stretch for inner thighs.","Use blocks under hands for support."]);
add("boat-pose","Boat Pose",["Navasana","V-sit yoga"],"yoga","yoga-seated",["abs","hip-flexors","core"],["quads"],["yoga-mat"],"intermediate","yoga-hold",["Sit, lean back slightly, lift legs to 45 degrees.","Arms extend forward parallel to floor.","Balance on sit bones.","Keep spine straight."],["Modify by bending knees (half boat).","Builds significant core strength."]);
add("seated-twist","Seated Twist",["Ardha Matsyendrasana","half lord of the fishes"],"yoga","yoga-seated",["obliques","core"],["lower-back","hip-flexors"],["yoga-mat"],"beginner","yoga-hold",["Sit with one leg extended, cross other foot over outside.","Twist toward the bent knee.","Use opposite elbow against knee for leverage.","Lengthen spine with each inhale, deepen twist with exhale."],["Twist from the thoracic spine, not lumbar.","Switch sides."]);
add("cow-face-pose","Cow Face Pose",["Gomukhasana"],"yoga","yoga-seated",["glutes","shoulders"],["hip-flexors","triceps"],["yoga-mat"],"intermediate","yoga-hold",["Cross one knee over the other, stacking.","Reach one arm overhead, other behind back.","Try to clasp hands behind back.","Sit tall."],["Use a strap between hands if needed.","Deep hip and shoulder opener."]);
add("hero-pose","Hero Pose",["Virasana"],"yoga","yoga-seated",["quads","hip-flexors"],["calves"],["yoga-mat"],"intermediate","yoga-hold",["Kneel with feet outside hips, sit between heels.","Sit tall with spine straight.","Hands on thighs.","Hold."],["Sit on a block if it's too intense on knees.","Great quad and ankle stretch."]);
add("lotus-pose","Lotus Pose",["Padmasana","full lotus"],"yoga","yoga-seated",["hip-flexors","adductors"],["glutes"],["yoga-mat"],"advanced","yoga-hold",["Sit cross-legged, place each foot on opposite thigh.","Sit tall with spine straight.","Hands on knees in mudra.","Hold."],["Requires significant hip flexibility.","Never force; risk of knee injury."]);
add("half-lotus","Half Lotus",["Ardha Padmasana"],"yoga","yoga-seated",["hip-flexors","adductors"],["glutes"],["yoga-mat"],"intermediate","yoga-hold",["Sit cross-legged, place one foot on opposite thigh.","Other foot stays under opposite thigh.","Sit tall.","Switch which leg is on top."],["Easier progression toward full lotus.","Great meditation posture."]);
add("fire-log-pose","Fire Log Pose",["Agnistambhasana","double pigeon"],"yoga","yoga-seated",["hip-flexors","glutes"],["adductors"],["yoga-mat"],"intermediate","yoga-hold",["Sit and stack shins parallel, one on top of the other.","Flex both feet.","Sit tall or fold forward.","Switch which leg is on top."],["Intense outer hip stretch.","Use blankets under knees for support."]);
add("easy-pose","Easy Pose",["Sukhasana","cross legged seat"],"yoga","yoga-seated",["hip-flexors"],["core","lower-back"],["yoga-mat"],"beginner","yoga-hold",["Sit cross-legged comfortably.","Sit tall, spine straight.","Hands on knees.","Close eyes and breathe."],["Simplest meditation posture.","Sit on blanket to elevate hips."]);

console.log('Yoga seated: ' + exercises.length);

// ═══════════════════════════════════════════════════════════════════
// YOGA — PRONE/SUPINE
// ═══════════════════════════════════════════════════════════════════
add("cobra-pose","Cobra",["Bhujangasana","baby cobra"],"yoga","yoga-prone",["erector-spinae","lower-back"],["chest","shoulders","abs"],["yoga-mat"],"beginner","yoga-hold",["Lie face down, hands under shoulders.","Press up lifting chest off floor.","Keep elbows slightly bent, hips on floor.","Look forward or slightly up."],["Don't push too high; use back muscles, not arms.","Great for spinal extension mobility."]);
add("upward-dog","Upward Dog",["Urdhva Mukha Svanasana","up dog"],"yoga","yoga-prone",["erector-spinae","chest"],["shoulders","abs","hip-flexors"],["yoga-mat"],"intermediate","yoga-hold",["From plank, lower down and press up straightening arms.","Lift thighs and knees off floor.","Open chest forward and up.","Only hands and tops of feet touch floor."],["Stronger backbend than cobra.","Keep shoulders down from ears."]);
add("locust-pose","Locust",["Salabhasana","locust pose"],"yoga","yoga-prone",["erector-spinae","glutes"],["hamstrings","shoulders"],["yoga-mat"],"beginner","yoga-hold",["Lie face down, arms at sides.","Lift chest, arms, and legs off floor simultaneously.","Reach fingers toward toes.","Hold and breathe."],["Great for strengthening the entire back.","Start with just lifting chest."]);
add("bow-pose","Bow Pose",["Dhanurasana"],"yoga","yoga-prone",["erector-spinae","quads","chest"],["shoulders","hip-flexors"],["yoga-mat"],"intermediate","yoga-hold",["Lie face down, bend knees and grab ankles.","Kick feet into hands lifting chest and thighs.","Rock gently if desired.","Keep breathing."],["Deep backbend and quad stretch.","Don't compress lower back."]);
add("sphinx-pose","Sphinx",["Salamba Bhujangasana","sphinx pose"],"yoga","yoga-prone",["erector-spinae","lower-back"],["chest","abs"],["yoga-mat"],"beginner","yoga-hold",["Lie face down, forearms on floor, elbows under shoulders.","Lift chest keeping forearms down.","Relax shoulders.","Hold and breathe."],["Gentle backbend for beginners.","Great for spinal health."]);
add("bridge-pose","Bridge",["Setu Bandha Sarvangasana","bridge pose yoga"],"yoga","yoga-prone",["glutes","erector-spinae"],["quads","hamstrings","chest"],["yoga-mat"],"beginner","yoga-hold",["Lie on back, knees bent, feet flat on floor.","Press hips up toward ceiling.","Interlace hands under back if desired.","Hold."],["Foundation for wheel pose.","Keep knees hip-width apart."]);
add("wheel-pose","Wheel",["Urdhva Dhanurasana","full bridge","upward bow"],"yoga","yoga-prone",["erector-spinae","shoulders","chest"],["quads","hip-flexors","core"],["yoga-mat"],"advanced","yoga-hold",["Lie on back, place hands by ears fingers pointing toward shoulders.","Press up straightening arms and legs.","Lift fully into backbend.","Breathe and hold."],["Requires significant upper body and spine flexibility.","Warm up thoroughly first."]);
add("shoulder-stand","Shoulder Stand",["Sarvangasana","supported shoulderstand"],"yoga","yoga-prone",["core","shoulders"],["neck","back"],["yoga-mat"],"intermediate","yoga-hold",["Lie on back, roll legs overhead.","Support lower back with hands.","Extend legs straight up.","Keep weight on shoulders, not neck."],["Use blankets under shoulders to protect neck.","The queen of all poses in yoga."]);
add("plow-pose","Plow",["Halasana","plow pose"],"yoga","yoga-prone",["hamstrings","lower-back"],["core","shoulders"],["yoga-mat"],"intermediate","yoga-hold",["From shoulder stand, lower feet behind head to floor.","Keep legs straight.","Arms can press into floor or support back.","Keep weight on shoulders."],["Don't turn head while in this pose.","Use blankets under shoulders."]);
add("fish-pose","Fish Pose",["Matsyasana"],"yoga","yoga-prone",["chest","erector-spinae"],["shoulders","hip-flexors"],["yoga-mat"],"intermediate","yoga-hold",["Lie on back, place hands under hips.","Lift chest, arch back, let head drop back.","Crown of head may touch floor.","Breathe deeply expanding chest."],["Counter-pose to shoulder stand and plow.","Opens the chest and throat."]);
add("happy-baby","Happy Baby",["Ananda Balasana","happy baby pose"],"yoga","yoga-prone",["hip-flexors","adductors","glutes"],["lower-back","hamstrings"],["yoga-mat"],"beginner","yoga-hold",["Lie on back, grab outsides of feet.","Pull knees toward armpits.","Rock gently side to side.","Keep lower back on floor."],["Relaxing hip opener.","Great at the end of practice."]);
add("reclined-pigeon","Reclined Pigeon",["figure four stretch","supine pigeon"],"yoga","yoga-prone",["glutes","hip-flexors"],["hamstrings","lower-back"],["yoga-mat"],"beginner","yoga-hold",["Lie on back, cross one ankle over opposite knee.","Pull uncrossed leg toward chest.","Feel stretch in crossed leg's hip.","Switch sides."],["Safer version of pigeon for beginners.","Press knee away to deepen."]);
add("supine-twist","Supine Twist",["Supta Matsyendrasana","reclined twist"],"yoga","yoga-prone",["obliques","lower-back"],["core","glutes"],["yoga-mat"],"beginner","yoga-hold",["Lie on back, bring one knee to chest.","Guide knee across body to floor.","Extend opposite arm out.","Look toward extended arm."],["Great for spinal decompression.","Let gravity do the work."]);
add("legs-up-wall","Legs Up Wall",["Viparita Karani","legs up the wall"],"yoga","yoga-prone",["hamstrings"],["lower-back","calves"],["yoga-mat"],"beginner","yoga-hold",["Sit sideways next to wall, then lie back swinging legs up.","Rest legs against wall, arms at sides.","Close eyes and relax.","Hold 5-15 minutes."],["Deeply restorative; great for recovery.","Reduces leg swelling and fatigue."]);
add("savasana","Savasana",["corpse pose","final resting pose"],"yoga","yoga-prone",["full-body"],["core"],["yoga-mat"],"beginner","yoga-hold",["Lie on back, arms at sides, palms up.","Let feet fall open naturally.","Close eyes and relax every muscle.","Breathe naturally for 5-15 minutes."],["The most important and hardest yoga pose.","Don't skip it."]);
add("reclined-bound-angle","Reclined Bound Angle",["Supta Baddha Konasana","reclined butterfly"],"yoga","yoga-prone",["hip-flexors","adductors"],["lower-back","chest"],["yoga-mat","yoga-bolster"],"beginner","yoga-hold",["Lie on back, soles of feet together, knees open.","Arms at sides or on belly.","Use bolster under back for more opening.","Relax and hold."],["Deeply restorative hip opener.","Blocks under knees for support."]);

console.log('Yoga prone/supine: ' + exercises.length);

// ═══════════════════════════════════════════════════════════════════
// YOGA — BALANCE/INVERSIONS
// ═══════════════════════════════════════════════════════════════════
add("crow-pose","Crow",["Bakasana","crane pose"],"yoga","yoga-balance",["core","shoulders"],["triceps","hip-flexors","chest"],["yoga-mat"],"advanced","yoga-hold",["Squat with hands on floor shoulder-width apart.","Place knees on backs of upper arms.","Lean forward shifting weight to hands.","Lift feet off floor and balance."],["Gaze forward, not down.","Place pillow in front when learning."]);
add("side-crow","Side Crow",["Parsva Bakasana"],"yoga","yoga-balance",["obliques","core","shoulders"],["triceps"],["yoga-mat"],"advanced","yoga-hold",["Squat and twist, placing both knees on one upper arm.","Lean forward shifting weight to hands.","Lift feet off floor.","Balance on hands."],["Harder than regular crow.","Twist comes from thoracic spine."]);
add("firefly-pose","Firefly",["Tittibhasana"],"yoga","yoga-balance",["core","hamstrings","shoulders"],["triceps","hip-flexors"],["yoga-mat"],"advanced","yoga-hold",["Place hands on floor between feet in forward fold.","Sit back of thighs on upper arms.","Press up straightening arms and legs.","Extend legs wide."],["Requires significant hamstring and hip flexibility.","Work on shoulder and core strength first."]);
add("eight-angle-pose","Eight-Angle",["Astavakrasana"],"yoga","yoga-balance",["obliques","core","shoulders"],["triceps","hip-flexors"],["yoga-mat"],"advanced","yoga-hold",["Hook one leg over same-side arm.","Cross ankles and extend legs to one side.","Lean forward shifting weight to hands.","Balance with legs extended."],["Complex arm balance requiring multiple skills.","Practice each component separately."]);
add("flying-pigeon","Flying Pigeon",["Eka Pada Galavasana"],"yoga","yoga-balance",["core","shoulders","glutes"],["triceps","hip-flexors"],["yoga-mat"],"advanced","yoga-hold",["From standing, cross one ankle over opposite knee.","Place hands on floor and lean forward.","Extend back leg straight behind.","Balance."],["Combines hip opening with arm balance.","Very advanced; work up gradually."]);
add("handstand","Handstand",["Adho Mukha Vrksasana","handstand hold"],"yoga","yoga-balance",["shoulders","core","triceps"],["forearms","full-body"],["yoga-mat"],"advanced","yoga-hold",["Place hands on floor shoulder-width, about a foot from wall.","Kick up or press up to vertical inverted position.","Stack shoulders over wrists, hips over shoulders.","Hold."],["Practice against wall first.","Engages entire body."]);
add("forearm-stand","Forearm Stand",["Pincha Mayurasana","feathered peacock"],"yoga","yoga-balance",["shoulders","core"],["forearms","back"],["yoga-mat"],"advanced","yoga-hold",["Place forearms on floor parallel, elbows shoulder-width.","Walk feet in and kick up.","Stack body vertically.","Hold."],["Use wall for support when learning.","Requires strong shoulders and core."]);
add("headstand","Headstand",["Sirsasana","supported headstand"],"yoga","yoga-balance",["core","shoulders"],["neck","forearms"],["yoga-mat"],"advanced","yoga-hold",["Interlace fingers, place crown of head on floor.","Walk feet in, then lift legs overhead.","Stack body vertically.","Hold."],["The king of yoga poses.","Use forearms for most of the support, not head."]);
add("downward-dog","Downward Dog",["Adho Mukha Svanasana","down dog"],"yoga","yoga-balance",["shoulders","hamstrings","calves"],["core","back","lats"],["yoga-mat"],"beginner","yoga-hold",["Start on all fours, tuck toes and lift hips up and back.","Press heels toward floor, straighten legs.","Spread fingers, press into hands.","Create inverted V shape with body."],["Most common yoga pose.","Bend knees if hamstrings are tight."]);
add("dolphin-pose","Dolphin",["forearm downward dog"],"yoga","yoga-balance",["shoulders","core"],["hamstrings","calves"],["yoga-mat"],"intermediate","yoga-hold",["From all fours, place forearms on floor.","Lift hips up and back as in downward dog.","Keep forearms parallel on floor.","Walk feet toward elbows."],["Builds shoulder strength for forearm stand.","Great shoulder and hamstring stretch."]);

console.log('Yoga balance: ' + exercises.length);

// ═══════════════════════════════════════════════════════════════════
// YOGA — HIP OPENERS
// ═══════════════════════════════════════════════════════════════════
add("pigeon-pose","Pigeon",["Eka Pada Rajakapotasana","pigeon pose"],"yoga","yoga-hips",["glutes","hip-flexors"],["lower-back","hamstrings"],["yoga-mat"],"intermediate","yoga-hold",["From downward dog, bring one knee forward behind same wrist.","Extend back leg straight behind.","Lower hips toward floor.","Walk hands forward and fold over front leg."],["Most popular hip opener.","Use blanket under hip for support."]);
add("lizard-pose","Lizard",["Utthan Pristhasana","lizard lunge"],"yoga","yoga-hips",["hip-flexors","adductors"],["hamstrings","glutes"],["yoga-mat"],"intermediate","yoga-hold",["From low lunge, place both hands inside front foot.","Lower to forearms if possible.","Keep back leg straight and strong.","Hold."],["Deep hip flexor and inner thigh stretch.","Stay on hands if forearms are too intense."]);
add("frog-pose","Frog",["Mandukasana","frog stretch"],"yoga","yoga-hips",["adductors","hip-flexors"],["glutes"],["yoga-mat"],"intermediate","yoga-hold",["Start on all fours.","Widen knees as far apart as comfortable.","Lower hips toward floor, forearms on ground.","Keep ankles in line with knees."],["Very intense inner thigh stretch.","Use padding under knees."]);
add("malasana","Malasana",["garland pose","yoga squat","deep squat"],"yoga","yoga-hips",["hip-flexors","adductors","glutes"],["core","calves"],["yoga-mat"],"beginner","yoga-hold",["Stand with feet wider than hips, toes slightly out.","Squat deeply, bringing hips between feet.","Press elbows against inner knees, hands in prayer.","Keep spine tall."],["Great for ankle and hip mobility.","Sit on block if heels lift."]);
add("half-splits","Half Splits",["Ardha Hanumanasana","runner's stretch"],"yoga","yoga-hips",["hamstrings"],["calves","hip-flexors"],["yoga-mat"],"beginner","yoga-hold",["From low lunge, shift weight back straightening front leg.","Flex front foot, fold over straight leg.","Hands on blocks or floor.","Keep back knee on floor."],["Preparation for full splits.","Great hamstring stretch."]);
add("full-splits","Full Splits",["Hanumanasana","front splits"],"yoga","yoga-hips",["hamstrings","hip-flexors"],["adductors","glutes"],["yoga-mat"],"advanced","yoga-hold",["From half splits, slowly slide front heel forward.","Lower hips toward floor between legs.","Use blocks under hands for support.","Square hips forward."],["Takes months of practice to achieve.","Never force; use props."]);
add("king-pigeon","King Pigeon",["Eka Pada Rajakapotasana full","full pigeon"],"yoga","yoga-hips",["hip-flexors","quads","chest"],["shoulders","erector-spinae"],["yoga-mat"],"advanced","yoga-hold",["Set up in pigeon pose.","Bend back knee, reach back and grab foot.","Bring foot toward head.","Open chest toward ceiling."],["Very advanced hip and back flexibility.","Use strap to bridge the gap to foot."]);
add("reclined-pigeon-yoga","Reclined Pigeon",["supta pigeon","figure four yoga"],"yoga","yoga-hips",["glutes","hip-flexors"],["hamstrings"],["yoga-mat"],"beginner","yoga-hold",["Lie on back, cross one ankle over opposite knee.","Pull bottom leg toward chest.","Feel stretch in outer hip.","Switch sides."],["Gentler version of pigeon.","Great for tight hips."]);

// ═══════════════════════════════════════════════════════════════════
// YOGA — FLOWS
// ═══════════════════════════════════════════════════════════════════
add("sun-salutation-a","Sun Salutation A",["Surya Namaskar A","sun sal A"],"yoga","yoga-flow",["full-body"],["core","shoulders","hamstrings","chest"],["yoga-mat"],"beginner","bodyweight-reps",["Start in mountain, fold forward, half lift.","Step or jump to plank, lower to chaturanga.","Upward dog, then downward dog.","Walk to front, fold, rise to mountain."],["Foundation of vinyasa yoga.","Synchronize breath with movement."]);
add("sun-salutation-b","Sun Salutation B",["Surya Namaskar B","sun sal B"],"yoga","yoga-flow",["full-body"],["quads","shoulders","core","hamstrings"],["yoga-mat"],"intermediate","bodyweight-reps",["Start in chair pose, fold forward, half lift.","Chaturanga, up dog, down dog.","Warrior I right, chaturanga, up dog, down dog.","Warrior I left, chaturanga, up dog, down dog, chair."],["More challenging than Sun A with warrior additions.","Builds heat and strength."]);
add("moon-salutation","Moon Salutation",["Chandra Namaskar"],"yoga","yoga-flow",["full-body","hip-flexors"],["core","shoulders","adductors"],["yoga-mat"],"intermediate","bodyweight-reps",["Start in mountain, side bend, goddess squat.","Wide fold, low lunge, twist.","Return through goddess and side bend.","Practice on both sides."],["Cooling, grounding sequence.","Great for evening practice."]);

console.log('Yoga flows/hips: ' + exercises.length);

// ═══════════════════════════════════════════════════════════════════
// PILATES — MAT BEGINNER
// ═══════════════════════════════════════════════════════════════════
add("the-hundred","The Hundred",["hundred pilates","hundreds"],"pilates","pilates-mat-beginner",["abs","core"],["hip-flexors"],["yoga-mat"],"beginner","pilates-reps",["Lie on back, lift head and shoulders, legs in tabletop or extended.","Arms extend by sides, pump arms up and down.","Inhale for 5 pumps, exhale for 5 pumps.","Complete 100 pumps total."],["Foundation of Pilates mat work.","Modify by keeping feet on floor."]);
add("pilates-roll-up","Roll-Up",["Pilates roll up"],"pilates","pilates-mat-beginner",["abs","core"],["hip-flexors"],["yoga-mat"],"beginner","pilates-reps",["Lie flat, arms overhead.","Slowly roll up one vertebra at a time reaching for toes.","Roll back down with control.","Maintain fluid motion."],["Keep feet on floor.","Use a band if you cannot roll up fully."]);
add("single-leg-circle","Single Leg Circle",["leg circles pilates"],"pilates","pilates-mat-beginner",["hip-flexors","abs"],["core","adductors","quads"],["yoga-mat"],"beginner","pilates-reps",["Lie on back, one leg extended to ceiling.","Circle the leg smoothly across body, down, and around.","Keep hips stable.","Reverse direction, then switch legs."],["Don't let hips rock.","Smaller circles are harder to control."]);
add("rolling-like-a-ball","Rolling Like a Ball",["ball roll pilates"],"pilates","pilates-mat-beginner",["abs","core"],["hip-flexors"],["yoga-mat"],"beginner","pilates-reps",["Sit in a tuck position, holding shins.","Roll backward to shoulder blades.","Roll forward to balance.","Maintain tuck shape throughout."],["Don't roll onto neck.","Massage for the spine."]);
add("single-leg-stretch","Single Leg Stretch",["pilates single leg stretch"],"pilates","pilates-mat-beginner",["abs","core"],["hip-flexors","obliques"],["yoga-mat"],"beginner","pilates-reps",["Lie on back, lift head and shoulders.","Pull one knee to chest, extend other leg.","Switch legs.","Hands guide the pulling knee."],["Classic Pilates ab exercise.","Keep lower back pressed to floor."]);
add("double-leg-stretch","Double Leg Stretch",["pilates double leg stretch"],"pilates","pilates-mat-beginner",["abs","core"],["hip-flexors","shoulders"],["yoga-mat"],"beginner","pilates-reps",["Lie on back, head and shoulders up, knees to chest.","Extend arms overhead and legs out simultaneously.","Circle arms around and pull knees back in.","Maintain lifted upper body throughout."],["Inhale to extend, exhale to curl in.","Don't let lower back arch."]);
add("spine-stretch-forward","Spine Stretch Forward",["seated spine stretch"],"pilates","pilates-mat-beginner",["lower-back","hamstrings"],["abs","core"],["yoga-mat"],"beginner","pilates-reps",["Sit tall with legs extended, feet flexed.","Round forward reaching past toes.","Articulate spine one vertebra at a time.","Roll back up to sitting."],["Focus on spinal articulation.","Keep legs straight."]);
add("pilates-saw","Saw",["pilates saw exercise"],"pilates","pilates-mat-beginner",["obliques","hamstrings"],["core","shoulders"],["yoga-mat"],"beginner","pilates-reps",["Sit with legs wide, arms extended to sides.","Twist and reach opposite hand toward outside of foot.","Pulse three times deeper.","Return to center, twist other side."],["Great for spinal rotation and hamstring flexibility.","Keep both sit bones grounded."]);
add("swan-dive-prep","Swan Dive Prep",["swan prep","baby swan"],"pilates","pilates-mat-beginner",["erector-spinae","lower-back"],["glutes","shoulders"],["yoga-mat"],"beginner","pilates-reps",["Lie face down, hands under shoulders.","Press up lifting chest.","Lower under control.","Keep legs together."],["Pilates version of cobra.","Don't push too high."]);
add("pilates-swimming","Swimming",["pilates swimming exercise"],"pilates","pilates-mat-beginner",["erector-spinae","glutes"],["hamstrings","shoulders","core"],["yoga-mat"],"beginner","pilates-reps",["Lie face down, extend arms and legs.","Lift opposite arm and leg.","Flutter quickly alternating.","Keep core engaged."],["Like a prone flutter.","Lift from the back, not the limbs."]);
add("side-kick-series","Side Kick Series",["pilates side kicks"],"pilates","pilates-mat-beginner",["glutes","abductors","hip-flexors"],["core","quads"],["yoga-mat"],"beginner","pilates-reps",["Lie on side, bottom arm supporting head.","Kick top leg forward and back.","Lift and lower top leg.","Add circles."],["Comprehensive hip and glute series.","Keep torso stable throughout."]);
add("pelvic-curl","Pelvic Curl",["Pilates bridge","pelvic tilt bridge"],"pilates","pilates-mat-beginner",["glutes","hamstrings"],["core","erector-spinae"],["yoga-mat"],"beginner","pilates-reps",["Lie on back, knees bent, feet flat.","Tilt pelvis and roll spine up one vertebra at a time.","Hold at top.","Roll down slowly."],["Focus on sequential spinal articulation.","Foundation movement in Pilates."]);
add("chest-lift","Chest Lift",["Pilates crunch","Pilates chest lift"],"pilates","pilates-mat-beginner",["abs"],["core"],["yoga-mat"],"beginner","pilates-reps",["Lie on back, hands behind head, knees bent.","Curl head and shoulders up.","Hold briefly.","Lower under control."],["Don't pull on neck.","Focus on curling ribs toward hips."]);
add("toe-taps","Toe Taps",["pilates toe taps","alternating toe taps"],"pilates","pilates-mat-beginner",["abs","core"],["hip-flexors"],["yoga-mat"],"beginner","pilates-reps",["Lie on back, legs in tabletop position.","Slowly lower one toe to tap the floor.","Return to tabletop, switch legs.","Keep lower back pressed to floor."],["Great for learning pelvic stability.","Smaller movement = more control."]);

console.log('Pilates beginner: ' + exercises.length);

// ═══════════════════════════════════════════════════════════════════
// PILATES — MAT INTERMEDIATE
// ═══════════════════════════════════════════════════════════════════
add("open-leg-rocker","Open Leg Rocker",["pilates rocker"],"pilates","pilates-mat-intermediate",["abs","core"],["hip-flexors","hamstrings"],["yoga-mat"],"intermediate","pilates-reps",["Sit in V shape holding ankles, legs extended.","Roll back to shoulder blades.","Roll up to balance.","Maintain V shape throughout."],["Requires good hamstring flexibility.","Don't roll onto neck."]);
add("pilates-corkscrew","Corkscrew",["pilates corkscrew"],"pilates","pilates-mat-intermediate",["obliques","abs"],["core","hip-flexors"],["yoga-mat"],"intermediate","pilates-reps",["Lie on back, legs extended to ceiling.","Circle legs together in one direction.","Reverse direction.","Keep upper body stable."],["Challenges rotational control.","Start with small circles."]);
add("neck-pull","Neck Pull",["pilates neck pull"],"pilates","pilates-mat-intermediate",["abs","core"],["hip-flexors","hamstrings"],["yoga-mat"],"intermediate","pilates-reps",["Lie flat, hands behind head.","Roll up to sitting.","Fold forward over legs.","Roll back down with control."],["Harder than roll-up because hands are behind head.","Use legs anchored under something if needed."]);
add("pilates-scissors","Scissors",["pilates scissors"],"pilates","pilates-mat-intermediate",["abs","hip-flexors","hamstrings"],["core"],["yoga-mat"],"intermediate","pilates-reps",["Lie on back, lift legs to ceiling.","Split legs apart in scissors motion.","Switch rapidly.","Keep pelvis stable."],["Support hips with hands if needed.","Keep legs straight."]);
add("pilates-bicycle","Bicycle",["pilates bicycle"],"pilates","pilates-mat-intermediate",["abs","hip-flexors","obliques"],["core"],["yoga-mat"],"intermediate","pilates-reps",["Lie on back, legs to ceiling, support hips.","Pedal legs as if cycling.","One leg extends down as other bends in.","Keep movement smooth."],["Controlled pedaling motion.","Support lower back."]);
add("shoulder-bridge","Shoulder Bridge",["pilates shoulder bridge"],"pilates","pilates-mat-intermediate",["glutes","hamstrings"],["core","quads"],["yoga-mat"],"intermediate","pilates-reps",["Set up as for pelvic curl, roll hips up.","Extend one leg to ceiling.","Lower and lift that leg.","Switch legs, then roll down."],["Challenges single-leg stability.","Keep hips level."]);
add("pilates-side-bend","Side Bend",["pilates side bend"],"pilates","pilates-mat-intermediate",["obliques","core"],["shoulders"],["yoga-mat"],"intermediate","pilates-reps",["Sit on one hip, legs stacked, bottom hand on floor.","Press up into side plank with arm overhead.","Lower and repeat.","Switch sides."],["Beautiful lateral strength exercise.","Keep body in one plane."]);
add("pilates-teaser","Teaser",["pilates teaser","teaser exercise"],"pilates","pilates-mat-intermediate",["abs","core","hip-flexors"],["quads"],["yoga-mat"],"intermediate","pilates-reps",["Lie flat, arms overhead, legs at 45 degrees.","Roll up reaching arms parallel to legs in V shape.","Hold at top.","Roll down with control."],["The signature Pilates exercise.","Start with feet on floor as modification."]);
add("hip-circles","Hip Circles",["pilates hip circles"],"pilates","pilates-mat-intermediate",["abs","hip-flexors","obliques"],["core"],["yoga-mat"],"intermediate","pilates-reps",["Sit leaning back on hands, legs extended to 45 degrees.","Circle both legs together.","Reverse direction.","Keep upper body stable."],["Challenges full core stability.","Start with smaller circles."]);
add("leg-pull-front","Leg Pull Front",["pilates plank leg pull"],"pilates","pilates-mat-intermediate",["core","shoulders"],["glutes","hamstrings"],["yoga-mat"],"intermediate","pilates-reps",["Start in plank position.","Lift one leg, point toe.","Rock forward and back on standing foot.","Switch legs."],["Combines plank with hip extension.","Keep hips level."]);
add("leg-pull-back","Leg Pull Back",["reverse plank leg pull"],"pilates","pilates-mat-intermediate",["core","glutes","triceps"],["hamstrings","shoulders"],["yoga-mat"],"intermediate","pilates-reps",["Sit with legs extended, hands behind on floor.","Press up into reverse plank.","Lift one leg to ceiling.","Lower and switch."],["Challenges posterior chain and wrists.","Keep hips lifted."]);
add("mermaid-stretch","Mermaid Stretch",["pilates mermaid"],"pilates","pilates-mat-intermediate",["obliques"],["lats","core"],["yoga-mat"],"intermediate","pilates-reps",["Sit with legs folded to one side.","Reach arm overhead, lateral bend away from legs.","Feel stretch along side body.","Return and switch sides."],["Beautiful side body stretch.","Keep both sit bones grounded."]);

console.log('Pilates intermediate: ' + exercises.length);

// ═══════════════════════════════════════════════════════════════════
// PILATES — MAT ADVANCED
// ═══════════════════════════════════════════════════════════════════
add("pilates-jackknife","Jackknife",["pilates jackknife"],"pilates","pilates-mat-advanced",["abs","core"],["hip-flexors","lower-back"],["yoga-mat"],"advanced","pilates-reps",["Lie on back, legs to ceiling.","Roll legs over head toward floor.","Press legs straight up to ceiling.","Roll down slowly one vertebra at a time."],["Requires significant core strength.","Control the rolldown."]);
add("control-balance","Control Balance",["pilates control balance"],"pilates","pilates-mat-advanced",["abs","core","hamstrings"],["hip-flexors"],["yoga-mat"],"advanced","pilates-reps",["From plow position, hold one ankle.","Extend other leg to ceiling.","Switch legs.","Maintain balance on upper back."],["Advanced balance and control exercise.","Requires flexibility."]);
add("pilates-boomerang","Boomerang",["pilates boomerang"],"pilates","pilates-mat-advanced",["abs","core","hip-flexors"],["hamstrings","shoulders"],["yoga-mat"],"advanced","pilates-reps",["Sit with legs crossed, arms at sides.","Roll back, switch leg cross, roll up into teaser.","Reach arms behind, fold forward.","Return to start."],["Combines multiple Pilates skills.","Requires fluidity."]);
add("pilates-seal","Seal",["pilates seal exercise"],"pilates","pilates-mat-advanced",["abs","core"],["hip-flexors"],["yoga-mat"],"advanced","pilates-reps",["Sit in tuck, thread arms inside legs gripping feet.","Roll back clapping feet together three times.","Roll up and clap three times.","Maintain tuck throughout."],["Fun exercise that massages the spine.","The seal clap requires coordination."]);
add("pilates-rocking","Rocking",["pilates rocking exercise"],"pilates","pilates-mat-advanced",["erector-spinae","quads"],["glutes","shoulders"],["yoga-mat"],"advanced","pilates-reps",["Lie face down, grab ankles behind you.","Rock forward and back in bow position.","Inhale rocking forward, exhale rocking back.","Maintain hold on ankles."],["Similar to yoga bow pose with rocking.","Requires back flexibility."]);
add("pilates-star","Star",["pilates star exercise","side plank star"],"pilates","pilates-mat-advanced",["obliques","core"],["shoulders","glutes"],["yoga-mat"],"advanced","pilates-reps",["Start in side plank on one hand.","Lift top leg and arm creating star shape.","Hold briefly.","Lower and switch sides."],["Peak Pilates side body exercise.","Requires significant strength and balance."]);
add("push-up-pilates","Push-Up Pilates",["pilates push up"],"pilates","pilates-mat-advanced",["chest","triceps","core"],["shoulders"],["yoga-mat"],"advanced","pilates-reps",["Stand tall, roll down to floor walking hands out.","Perform 3-5 push-ups.","Walk hands back to feet.","Roll up to standing."],["Combines push-ups with spinal articulation.","Emphasizes control and flow."]);
add("kneeling-side-kick","Kneeling Side Kick",["pilates kneeling kick"],"pilates","pilates-mat-advanced",["obliques","glutes","abductors"],["core"],["yoga-mat"],"advanced","pilates-reps",["Kneel, lean to one side placing hand on floor.","Extend top leg to hip height.","Kick forward and back.","Switch sides."],["Challenges lateral stability.","Keep torso lifted."]);
add("pilates-crab","Crab",["pilates crab exercise"],"pilates","pilates-mat-advanced",["abs","core"],["hip-flexors","neck"],["yoga-mat"],"advanced","pilates-reps",["Sit in tuck, cross ankles, hold feet.","Roll back to upper back.","Switch ankle cross at top.","Roll up and touch crown to floor."],["Very advanced; requires neck strength.","Keep the movement controlled."]);

console.log('Pilates advanced: ' + exercises.length);

// ═══════════════════════════════════════════════════════════════════
// PILATES — REFORMER
// ═══════════════════════════════════════════════════════════════════
add("footwork-series","Footwork Series",["reformer footwork","pilates footwork"],"pilates","pilates-reformer",["quads","calves","glutes"],["core","hamstrings"],["pilates-reformer"],"beginner","pilates-reps",["Lie on reformer, feet on footbar in various positions.","Press carriage out straightening legs.","Return with control.","Change foot positions: parallel, V, wide, heels."],["Foundation reformer exercise.","Maintain stable pelvis throughout."]);
add("reformer-leg-circles","Leg Circles",["reformer leg circles"],"pilates","pilates-reformer",["hip-flexors","abs"],["adductors","core"],["pilates-reformer"],"intermediate","pilates-reps",["Lie on reformer, straps on feet.","Circle legs together in coordinated pattern.","Reverse direction.","Keep pelvis stable."],["The straps provide resistance throughout.","Control the carriage movement."]);
add("reformer-frog","Frog",["reformer frog exercise"],"pilates","pilates-reformer",["adductors","glutes"],["core","quads"],["pilates-reformer"],"beginner","pilates-reps",["Lie on reformer, feet in straps, heels together toes apart.","Extend legs out pressing carriage.","Return to frog position.","Keep pelvis neutral."],["Classic reformer inner thigh exercise.","Maintain diamond shape with legs."]);
add("reformer-elephant","Elephant",["pilates elephant"],"pilates","pilates-reformer",["hamstrings","core"],["shoulders","calves"],["pilates-reformer"],"intermediate","pilates-reps",["Stand on carriage, hands on footbar, hips lifted.","Press carriage back with legs.","Pull carriage in with abs.","Maintain flat back."],["Similar to downward dog on reformer.","Uses deep core connection."]);
add("knee-stretches","Knee Stretches",["reformer knee stretches"],"pilates","pilates-reformer",["abs","core","hip-flexors"],["quads","shoulders"],["pilates-reformer"],"intermediate","pilates-reps",["Kneel on carriage, hands on footbar.","Press carriage out with knees.","Pull in with abs.","Try round back, flat back, and knees off versions."],["Three variations increase in difficulty.","Knees-off version is very challenging."]);
add("running-on-reformer","Running on Reformer",["reformer running","prances"],"pilates","pilates-reformer",["calves","quads"],["core"],["pilates-reformer"],"beginner","pilates-reps",["Lie on reformer, balls of feet on footbar, legs extended.","Alternate bending one knee while other stays straight.","Like running in place on the footbar.","Maintain stable pelvis."],["Great for calf stretching and alignment.","Keep carriage still."]);
add("stomach-massage","Stomach Massage",["reformer stomach massage"],"pilates","pilates-reformer",["abs","core","quads"],["hip-flexors","calves"],["pilates-reformer"],"intermediate","pilates-reps",["Sit on carriage facing footbar, feet on bar.","Round forward, press carriage out.","Return, maintaining round spine.","Progress to flat back, reach, and twist versions."],["Builds abdominal strength and spinal flexibility.","Keep feet on bar."]);
add("short-spine","Short Spine",["short spine massage","reformer short spine"],"pilates","pilates-reformer",["abs","hamstrings"],["core","lower-back"],["pilates-reformer"],"intermediate","pilates-reps",["Lie on reformer, feet in straps.","Press legs to 45, then roll hips over to bring feet overhead.","Bend knees bringing heels to seat.","Roll down one vertebra at a time."],["Massage for the entire spine.","Keep straps taut throughout."]);
add("long-spine","Long Spine",["long spine stretch","reformer long spine"],"pilates","pilates-reformer",["abs","core","hamstrings"],["lower-back","glutes"],["pilates-reformer"],"advanced","pilates-reps",["Lie on reformer, feet in straps.","Extend legs long, then roll hips overhead.","Open legs to shoulder width at top.","Roll down with legs apart, close at bottom."],["Advanced version of short spine.","Requires more control."]);
add("tendon-stretch","Tendon Stretch",["reformer tendon stretch"],"pilates","pilates-reformer",["core","shoulders","hamstrings"],["triceps","quads"],["pilates-reformer"],"advanced","pilates-reps",["Sit on edge of carriage, hands on footbar, feet on headrest.","Lift hips, press carriage out with feet.","Pull back in with abs.","Maintain lifted position throughout."],["Very challenging full-body exercise.","Requires significant upper body strength."]);
add("long-stretch","Long Stretch",["reformer long stretch","plank on reformer"],"pilates","pilates-reformer",["core","shoulders"],["chest","triceps","quads"],["pilates-reformer"],"intermediate","pilates-reps",["Start in plank with hands on footbar, feet on headrest.","Press carriage out maintaining plank.","Pull carriage in with core.","Keep body in one line."],["Moving plank on the reformer.","Don't let hips sag."]);
add("up-stretch","Up Stretch",["reformer up stretch"],"pilates","pilates-reformer",["core","hamstrings","shoulders"],["abs","calves"],["pilates-reformer"],"intermediate","pilates-reps",["Hands on footbar, feet on headrest, hips lifted (pike).","Press carriage out to plank.","Pull back to pike with abs.","Maintain straight arms."],["Combines pike and plank movements.","Strong core required."]);
add("reformer-arabesque","Arabesque",["reformer arabesque"],"pilates","pilates-reformer",["glutes","hamstrings","core"],["quads","shoulders"],["pilates-reformer"],"intermediate","pilates-reps",["Stand on one leg on carriage, other on footbar.","Press carriage back extending standing leg.","Return with control.","Switch legs."],["Challenges single-leg balance.","Keep hips square."]);
add("reformer-snake","Snake",["pilates snake reformer"],"pilates","pilates-reformer",["obliques","core","shoulders"],["chest","triceps"],["pilates-reformer"],"advanced","pilates-reps",["Start in side plank with hand on footbar, feet on carriage.","Press carriage out into extension.","Pull in and pike hips.","Switch sides."],["Very advanced oblique and shoulder exercise.","Requires excellent control."]);
add("reformer-mermaid","Mermaid",["reformer mermaid stretch"],"pilates","pilates-reformer",["obliques"],["lats","core","shoulders"],["pilates-reformer"],"intermediate","pilates-reps",["Sit sideways on carriage, hand on footbar.","Press carriage out reaching into lateral stretch.","Return with control.","Switch sides."],["Beautiful side body stretch with resistance.","Keep both sit bones down."]);
add("semi-circle","Semi-Circle",["reformer semi-circle"],"pilates","pilates-reformer",["erector-spinae","glutes","core"],["quads","hamstrings"],["pilates-reformer"],"intermediate","pilates-reps",["Lie on carriage, feet on footbar, hips lifted.","Press out, lower spine sequentially.","Roll back up at extended position.","Return carriage."],["Beautiful spinal articulation exercise.","Maintain hip height throughout."]);
add("chest-expansion","Chest Expansion",["reformer chest expansion"],"pilates","pilates-reformer",["back","rear-delts","rhomboids"],["triceps","core"],["pilates-reformer"],"beginner","pilates-reps",["Kneel on carriage facing headrest, hold straps.","Pull arms straight back expanding chest.","Look right, center, left, center.","Return arms with control."],["Great for posture correction.","Keep torso still."]);
add("thigh-stretch","Thigh Stretch",["reformer thigh stretch","kneeling thigh stretch"],"pilates","pilates-reformer",["quads","hip-flexors"],["core","glutes"],["pilates-reformer"],"intermediate","pilates-reps",["Kneel on carriage holding straps.","Lean back from knees keeping body straight.","Return to upright.","Maintain straight line from knees to head."],["Intense quad stretch and eccentric work.","Don't lean from hips."]);

console.log('Pilates reformer: ' + exercises.length);

// ═══════════════════════════════════════════════════════════════════
// BARRE
// ═══════════════════════════════════════════════════════════════════
add("barre-plie","Pli\u00e9",["barre plie","wide squat barre","ballet plie"],"strength","barre",["quads","adductors","glutes"],["calves","core"],["none"],"beginner","bodyweight-reps",["Stand in first or second position at the barre.","Bend knees deeply over toes.","Keep spine vertical and core engaged.","Rise with control."],["Classic ballet movement.","Turn out from hips, not just feet."]);
add("barre-releve","Relev\u00e9",["barre releve","calf raise barre","heel raise"],"strength","barre",["calves"],["core","quads"],["none"],"beginner","bodyweight-reps",["Stand at barre.","Rise onto balls of feet as high as possible.","Hold at top.","Lower with control."],["Builds calf strength and ankle stability.","Can combine with plie."]);
add("barre-arabesque-pulses","Arabesque Pulses",["barre arabesque","standing leg lift back"],"strength","barre",["glutes","hamstrings"],["core","lower-back"],["none"],"beginner","bodyweight-reps",["Stand at barre, lift one leg behind you.","Pulse leg up in small controlled movements.","Keep hips square.","Switch legs."],["Small movements, big burn.","Don't arch lower back."]);
add("attitude-lifts","Attitude Lifts",["barre attitude","bent leg lift"],"strength","barre",["glutes"],["hamstrings","core"],["none"],"beginner","bodyweight-reps",["Stand at barre, lift one leg behind with knee bent.","Lift and lower in small pulses.","Knee stays bent at 90 degrees.","Switch legs."],["Targets glute med and max.","Keep supporting leg strong."]);
add("barre-curtsy-lunge","Curtsy Lunge",["barre curtsy","curtsy barre"],"strength","barre",["glutes","quads"],["adductors","core"],["none"],"intermediate","bodyweight-reps",["Stand at barre.","Step one foot behind and across into curtsy.","Lower and pulse.","Return and switch."],["Targets outer glutes.","Keep torso upright."]);
add("barre-standing-leg-lift","Standing Leg Lift",["leg lift barre","standing abduction"],"strength","barre",["abductors","glutes"],["core","hip-flexors"],["none"],"beginner","bodyweight-reps",["Stand at barre, lift one leg to the side.","Pulse in small controlled movements.","Keep hips level.","Switch sides."],["Small controlled movements.","Don't lean away from working leg."]);
add("passe-balance","Pass\u00e9 Balance",["barre passe","retiree balance"],"strength","barre",["core","glutes"],["calves","quads"],["none"],"intermediate","duration",["Stand on one leg, other foot at knee or calf.","Rise onto ball of standing foot.","Balance and hold.","Switch legs."],["Challenges balance and ankle stability.","Find a focus point."]);
add("thigh-dancing","Thigh Dancing",["barre thigh work","kneeling lean back"],"strength","barre",["quads","core"],["hip-flexors","glutes"],["yoga-mat"],"intermediate","bodyweight-reps",["Kneel tall on mat.","Lean back from knees keeping body straight.","Return to upright.","Maintain straight line from knees to head."],["Intense quad burn.","Don't hinge at hips."]);
add("barre-pretzel","Pretzel",["barre pretzel","seated pretzel"],"strength","barre",["glutes","abductors"],["obliques","core"],["yoga-mat"],"intermediate","bodyweight-reps",["Sit with one leg bent in front, other behind.","Lift back leg, pulsing up.","Keep hips facing forward.","Switch sides."],["Targets deep glute muscles.","Small controlled movements."]);
add("barre-waterski","Waterski",["waterski barre","lean back barre"],"strength","barre",["quads","core"],["calves","glutes"],["none"],"intermediate","duration",["Stand at barre, lean back with straight body.","Heels lifted, weight on balls of feet.","Hold the lean.","Keep core engaged."],["Isometric quad challenge.","Shake means it's working."]);
add("fold-over","Fold-Over",["barre fold over","standing fold over"],"strength","barre",["hamstrings","glutes"],["core","lower-back"],["none"],"intermediate","bodyweight-reps",["Stand at barre, fold forward at hips.","Lift one leg behind you, knee slightly bent.","Pulse leg up.","Switch legs."],["Deeper hip hinge targets hamstrings more.","Keep back flat."]);
add("wide-second-plie-pulses","Wide Second Pli\u00e9 Pulses",["barre wide plie","sumo pulse"],"strength","barre",["quads","adductors","glutes"],["calves","core"],["none"],"beginner","bodyweight-reps",["Wide stance, toes out, lower into deep plie.","Pulse up and down in small range.","Stay low throughout.","Maintain vertical spine."],["The burn builds quickly.","Rise onto toes for extra calf work."]);
add("parallel-thigh","Parallel Thigh",["barre parallel thigh","narrow squat barre"],"strength","barre",["quads"],["core","glutes"],["none"],"intermediate","bodyweight-reps",["Stand with feet hip-width, parallel.","Lower into narrow squat.","Pulse in small range at the bottom.","Stay on balls of feet for more intensity."],["More quad-focused than turnout positions.","Keep knees tracking over toes."]);
add("barre-tricep-pushup","Tricep Push-Up (barre)",["barre pushup","narrow pushup barre"],"strength","barre",["triceps"],["chest","core"],["none"],"intermediate","bodyweight-reps",["Start in plank with elbows tucked close to body.","Lower slowly keeping elbows grazing ribs.","Push up with control.","Maintain plank alignment."],["Elbows stay tight to body.","Can be done on knees."]);
add("plank-to-pike-barre","Plank to Pike (barre)",["barre plank pike"],"strength","barre",["core","abs"],["shoulders","hamstrings"],["none"],"intermediate","bodyweight-reps",["Start in forearm plank.","Pike hips up then return to plank.","Maintain controlled tempo.","Keep legs as straight as possible."],["Great for deep core activation.","Don't rush the movement."]);
add("barre-curl","Barre Curl",["bicep curl barre","light weight curl barre"],"strength","barre",["biceps"],["forearms"],["dumbbell"],"beginner","weight-reps",["Stand at barre with light weights.","Curl with small controlled movements.","Pulse at various angles.","Keep elbows at sides."],["Very light weight, high reps.","Focuses on time under tension."]);

console.log('Barre: ' + exercises.length);

// ═══════════════════════════════════════════════════════════════════
// BOXING
// ═══════════════════════════════════════════════════════════════════
add("jab","Jab",["boxing jab","lead hand punch"],"sport","boxing",["shoulders","chest"],["core","triceps","forearms"],["boxing-gloves","hand-wraps"],"beginner","rounds-reps",["Stand in boxing stance, lead foot forward.","Extend lead hand straight out, rotating fist.","Snap back to guard position.","Maintain balance."],["The most important punch in boxing.","Speed over power."]);
add("cross","Cross",["boxing cross","rear hand punch","straight right"],"sport","boxing",["shoulders","chest"],["core","triceps","hip-flexors"],["boxing-gloves","hand-wraps"],"beginner","rounds-reps",["From boxing stance, drive rear hand straight forward.","Rotate rear hip and shoulder into the punch.","Return to guard.","Power comes from hip rotation."],["Your power punch.","Pivot rear foot for full power."]);
add("hook","Hook",["boxing hook","left hook","right hook"],"sport","boxing",["obliques","shoulders"],["core","biceps","chest"],["boxing-gloves","hand-wraps"],"intermediate","rounds-reps",["From guard, bend arm to 90 degrees.","Rotate torso swinging fist in horizontal arc.","Connect at chin level.","Return to guard."],["Power comes from rotation, not arm.","Keep elbow at 90 degrees."]);
add("uppercut","Uppercut",["boxing uppercut"],"sport","boxing",["shoulders","biceps"],["core","quads","hip-flexors"],["boxing-gloves","hand-wraps"],"intermediate","rounds-reps",["From guard, dip slightly bending knees.","Drive fist upward in a scooping motion.","Rotate hip into the punch.","Return to guard."],["Drop shoulder slightly before throwing.","Drive upward from the legs."]);
add("jab-cross-combo","Jab-Cross Combo",["1-2 combo","one two combo"],"sport","boxing",["shoulders","chest","core"],["triceps","hip-flexors"],["boxing-gloves","hand-wraps"],"beginner","rounds-reps",["Throw jab with lead hand.","Immediately follow with cross from rear hand.","Return to guard.","Maintain rhythm."],["The fundamental boxing combination.","Speed is more important than power."]);
add("jab-cross-hook","Jab-Cross-Hook",["1-2-3 combo"],"sport","boxing",["shoulders","chest","obliques","core"],["triceps","biceps"],["boxing-gloves","hand-wraps"],"intermediate","rounds-reps",["Jab with lead hand.","Cross with rear hand.","Follow with lead hook.","Return to guard."],["Most common 3-punch combination.","Flow between punches smoothly."]);
add("six-punch-combo","6-Punch Combo",["1-2-3-4-5-6","full combo"],"sport","boxing",["full-body","shoulders","core"],["chest","triceps","biceps"],["boxing-gloves","hand-wraps"],"intermediate","rounds-reps",["Jab, cross, lead hook, rear hook, lead uppercut, rear uppercut.","Flow between punches.","Maintain guard between combinations.","Reset stance after combo."],["Practice slowly then build speed.","Full-body workout in one combination."]);
add("slip-and-counter","Slip & Counter",["slip counter","defensive boxing"],"sport","boxing",["core","obliques"],["quads","shoulders"],["boxing-gloves","hand-wraps"],"intermediate","rounds-reps",["Start in boxing stance.","Slip head off center line as if dodging a punch.","Counter with cross or hook.","Return to guard."],["Defensive skill combined with offense.","Bend at knees, not waist."]);
add("bob-and-weave","Bob and Weave",["bobbing and weaving","duck and weave"],"sport","boxing",["quads","core","obliques"],["hamstrings","calves"],["boxing-gloves"],"intermediate","duration",["From boxing stance, bend knees dropping under imaginary punch.","Move head in U-shape under the punch.","Rise on the other side.","Maintain guard throughout."],["Great for leg and core endurance.","Stay low, don't just bend at waist."]);
add("heavy-bag-rounds","Heavy Bag Rounds",["bag work","heavy bag workout"],"sport","boxing",["full-body","cardio-system"],["shoulders","core","chest"],["heavy-bag","boxing-gloves","hand-wraps"],"intermediate","rounds-reps",["Work the heavy bag for 2-3 minute rounds.","Throw varied combinations.","Move around the bag.","Rest 30-60 seconds between rounds."],["Great full-body cardio workout.","Wrap hands properly to protect wrists."]);
add("speed-bag","Speed Bag",["speed bag workout","speed bag training"],"sport","boxing",["shoulders","forearms","cardio-system"],["biceps","core"],["speed-bag"],"intermediate","duration",["Stand in front of speed bag, fists at face height.","Strike bag with front of fists in circular rhythm.","Maintain consistent rhythm.","Keep elbows up."],["Develops hand speed and timing.","Start slow and build rhythm."]);
add("shadow-boxing","Shadow Boxing",["shadow box","shadow boxing rounds"],"sport","boxing",["full-body","cardio-system"],["shoulders","core","quads"],["none"],"beginner","duration",["Stand in boxing stance.","Throw combinations at imaginary opponent.","Move around, practice footwork.","Work in 2-3 minute rounds."],["Great warm-up or standalone workout.","Focus on form and technique."]);
add("boxing-kick","Kick (roundhouse/front/side)",["roundhouse kick","front kick","side kick"],"sport","boxing",["quads","hip-flexors","glutes"],["core","hamstrings","calves"],["none"],"intermediate","rounds-reps",["Chamber knee and extend leg in kick.","Roundhouse: rotate hip, kick with shin. Front: push kick straight. Side: chamber and extend.","Re-chamber knee and return to stance.","Maintain balance throughout."],["Always re-chamber; don't drop your leg.","Practice on a bag for power."]);
add("knee-strikes","Knee Strikes",["muay thai knees","knee strike"],"sport","boxing",["hip-flexors","quads","core"],["glutes","abs"],["none"],"intermediate","rounds-reps",["From fighting stance, grab imaginary opponent.","Drive knee upward with hip thrust.","Pull opponent down as knee drives up.","Alternate knees."],["Power comes from the hip drive.","Keep guard up while striking."]);

console.log('Boxing: ' + exercises.length);

// ═══════════════════════════════════════════════════════════════════
// CALISTHENICS
// ═══════════════════════════════════════════════════════════════════
add("calisthenics-muscle-up-bar","Muscle-Up (bar)",["bar muscle up calisthenics"],"calisthenics","calisthenics",["lats","chest","triceps"],["core","biceps","front-delts"],["pull-up-bar"],"advanced","bodyweight-reps",["Dead hang with false grip.","Pull explosively past bar.","Transition and press to lockout above bar.","Lower under control."],["The king of upper body calisthenics.","Practice transition separately."]);
add("calisthenics-muscle-up-ring","Muscle-Up (ring)",["ring muscle up"],"calisthenics","calisthenics",["lats","chest","triceps"],["core","biceps","front-delts","shoulders"],["gymnastic-rings"],"advanced","bodyweight-reps",["Hang from rings with false grip.","Pull explosively and transition above rings.","Press to full lockout.","Lower under control."],["Harder than bar muscle-up due to ring instability.","False grip is essential."]);
add("handstand-push-up-wall","Handstand Push-Up (wall)",["wall HSPU","wall handstand push-up"],"calisthenics","calisthenics",["shoulders","triceps"],["core","chest","traps"],["none"],"advanced","bodyweight-reps",["Kick up into handstand against wall.","Lower head toward floor bending arms.","Press back up to lockout.","Maintain body against wall."],["Use an abmat or pad under head.","Full range requires head touching floor."]);
add("handstand-push-up-free","Handstand Push-Up (free)",["freestanding HSPU","strict HSPU"],"calisthenics","calisthenics",["shoulders","triceps","core"],["chest","traps","full-body"],["none"],"advanced","bodyweight-reps",["Press or kick into freestanding handstand.","Lower under control.","Press back up while maintaining balance.","Requires excellent handstand balance."],["One of the hardest bodyweight exercises.","Master wall version first."]);
add("pistol-squat","Pistol Squat",["single leg squat","one leg squat"],"calisthenics","calisthenics",["quads","glutes"],["hamstrings","core","hip-flexors"],["none"],"advanced","bodyweight-reps",["Stand on one leg, other leg extended in front.","Squat down on standing leg to full depth.","Stand back up without touching ground.","Extend arms for balance."],["Requires excellent mobility, strength, and balance.","Use a counterweight or hold something for progression."]);
add("shrimp-squat","Shrimp Squat",["skater squat"],"calisthenics","calisthenics",["quads","glutes"],["core","hamstrings"],["none"],"advanced","bodyweight-reps",["Stand on one leg, grab opposite foot behind you.","Squat down until back knee touches or nears floor.","Stand back up.","Keep torso upright."],["Different from pistol squat; back leg bends.","Start with partial range of motion."]);
add("calisthenics-l-sit","L-Sit",["L-sit calisthenics","parallel bar L-sit"],"calisthenics","calisthenics",["abs","hip-flexors","core"],["triceps","quads","shoulders"],["parallettes","dip-station"],"advanced","duration",["Support yourself on parallettes or bars.","Lift legs to horizontal.","Hold with straight legs.","Core fully engaged."],["Start with tuck L-sit.","Hip flexor strength is often the limiter."]);
add("front-lever","Front Lever",["full front lever"],"calisthenics","calisthenics",["lats","core","abs"],["biceps","back","shoulders"],["pull-up-bar"],"advanced","duration",["Hang from bar.","Pull body to horizontal with arms straight.","Hold body parallel to floor, facing up.","Maintain straight body line."],["One of the hardest calisthenics holds.","Progress: tuck, advanced tuck, straddle, full."]);
add("back-lever","Back Lever",["back lever hold"],"calisthenics","calisthenics",["shoulders","core","chest"],["biceps","erector-spinae"],["pull-up-bar","gymnastic-rings"],"advanced","duration",["Start from inverted hang.","Lower body until horizontal, facing down.","Hold with straight arms.","Maintain body line."],["Significant shoulder flexibility required.","Progress through skin-the-cat first."]);
add("human-flag","Human Flag",["flag hold","pole flag"],"calisthenics","calisthenics",["obliques","shoulders","lats"],["core","full-body"],["pull-up-bar"],"advanced","duration",["Grip vertical pole with one hand high, one low.","Push with bottom arm, pull with top arm.","Extend body to horizontal.","Hold."],["Among the most impressive calisthenics feats.","Requires extreme oblique and shoulder strength."]);
add("planche-push-up","Planche Push-Up",["full planche push up"],"calisthenics","calisthenics",["chest","front-delts","core"],["triceps","shoulders"],["parallettes"],"advanced","bodyweight-reps",["Hold planche position (body horizontal, hands only).","Lower by bending arms.","Press back up.","Maintain planche throughout."],["Peak difficulty calisthenics pushing.","Years of training to achieve."]);
add("skin-the-cat","Skin the Cat",["german hang","pull through"],"calisthenics","calisthenics",["shoulders","core","lats"],["biceps","chest"],["pull-up-bar","gymnastic-rings"],"intermediate","bodyweight-reps",["Hang from bar or rings.","Tuck knees and rotate body backward through arms.","Extend into german hang (behind you).","Reverse back to start."],["Great for shoulder flexibility and strength.","Progress to straight body version."]);
add("tuck-front-lever-row","Tuck Front Lever Row",["front lever row","tuck FL row"],"calisthenics","calisthenics",["lats","back","core"],["biceps","abs"],["pull-up-bar"],"advanced","bodyweight-reps",["Hang from bar in tuck front lever position.","Pull body up toward bar.","Lower under control.","Maintain tuck position."],["Builds toward full front lever.","Great for developing back and core simultaneously."]);
add("archer-row-rings","Archer Row (rings)",["ring archer row"],"calisthenics","calisthenics",["lats","back"],["biceps","core"],["gymnastic-rings"],"advanced","bodyweight-reps",["Hang from rings in row position.","Pull toward one ring while other arm extends.","Alternate sides.","Maintain body alignment."],["Progression toward one-arm rows.","Keep body rigid throughout."]);
add("typewriter-pull-up","Typewriter Pull-Up",["side to side pull up","typewriter pullup"],"calisthenics","calisthenics",["lats","back","biceps"],["core","forearms"],["pull-up-bar"],"advanced","bodyweight-reps",["Pull up to one side of bar.","Move horizontally to other side while staying above bar.","Lower and repeat from other side.","Maintain chin above bar throughout traverse."],["Requires significant pulling strength.","Progress from archer pull-ups."]);

console.log('Calisthenics: ' + exercises.length);

// ═══════════════════════════════════════════════════════════════════
// FUNCTIONAL / CROSSFIT
// ═══════════════════════════════════════════════════════════════════
add("clean","Clean",["power clean","barbell clean"],"strength","functional",["full-body","quads","back"],["hamstrings","shoulders","traps","core"],["barbell"],"advanced","weight-reps",["Bar on floor, grip outside knees.","Pull explosively extending hips and shrugging.","Drop under bar and catch in front rack.","Stand to full extension."],["Olympic lift; requires coaching to learn safely.","Keep bar close to body."]);
add("clean-and-jerk","Clean & Jerk",["clean and jerk","C&J"],"strength","functional",["full-body"],["quads","shoulders","back","core","triceps"],["barbell"],"advanced","weight-reps",["Clean bar to shoulders.","Dip and drive bar overhead with split or push jerk.","Lock out overhead.","Return to standing."],["The heaviest lift in Olympic weightlifting.","Learn clean and jerk separately first."]);
add("snatch","Snatch",["barbell snatch","power snatch"],"strength","functional",["full-body","shoulders"],["quads","back","core","traps"],["barbell"],"advanced","weight-reps",["Wide grip on bar, bar on floor.","Pull explosively and drop under bar.","Catch overhead with straight arms.","Stand to full extension."],["Most technical barbell lift.","Requires excellent mobility and coaching."]);
add("thruster","Thruster",["barbell thruster","front squat to press"],"strength","functional",["quads","shoulders"],["core","triceps","glutes"],["barbell"],"intermediate","weight-reps",["Hold barbell in front rack position.","Squat to full depth.","Drive up and press bar overhead in one motion.","Lock out at top."],["Use the momentum from the squat for the press.","Devastating conditioning exercise."]);
add("wall-ball","Wall Ball",["wall ball shot","wall ball throw"],"strength","functional",["quads","shoulders","cardio-system"],["glutes","core","triceps"],["medicine-ball"],"intermediate","weight-reps",["Hold medicine ball at chest, face wall.","Squat below parallel.","Drive up and throw ball to target on wall.","Catch and repeat immediately."],["Standard CrossFit exercise.","Use 20lb/14lb ball, 10/9ft target."]);
add("box-jump-over","Box Jump Over",["box jump overs","lateral box jump"],"plyometrics","functional",["quads","glutes","cardio-system"],["calves","core"],["box"],"intermediate","bodyweight-reps",["Stand beside or behind box.","Jump onto and over box.","Land on other side.","Turn and repeat."],["Can step over for lower intensity.","Land softly with bent knees."]);
add("kb-clean","KB Clean",["kettlebell clean"],"strength","functional",["shoulders","forearms"],["core","back","quads"],["kettlebell"],"intermediate","weight-reps-each",["Start with KB between feet.","Swing and pull KB to rack position on chest.","Absorb with soft knees.","Lower and repeat."],["Don't flip the bell; guide it smoothly.","Keep elbow close to body."]);
add("kb-snatch","KB Snatch",["kettlebell snatch"],"strength","functional",["shoulders","full-body"],["core","back","quads","forearms"],["kettlebell"],"advanced","weight-reps-each",["Swing KB and in one motion bring overhead.","Punch through at top so KB lands softly on forearm.","Lock out overhead.","Lower in controlled arc."],["Keep KB close to body on the way up.","Powerful hip snap drives the movement."]);
add("kb-turkish-get-up","KB Turkish Get-Up",["kettlebell TGU","Turkish get up"],"strength","functional",["core","full-body","shoulders"],["glutes","quads","abs"],["kettlebell"],"advanced","weight-reps-each",["Lie down with KB pressed overhead.","Progress through sequence to standing.","Reverse to return to floor.","Keep arm locked out."],["Learn the sequence without weight first.","Each rep is a complete movement pattern."]);
add("kb-goblet-squat","KB Goblet Squat",["kettlebell goblet squat"],"strength","functional",["quads"],["glutes","core"],["kettlebell"],"beginner","weight-reps",["Hold KB at chest by horns.","Squat deeply, pushing knees out.","Drive up.","Keep torso upright."],["Best squat teaching tool.","Great for warm-ups."]);
add("double-under-functional","Double-Under",["DU","double unders"],"cardio","functional",["cardio-system","calves"],["shoulders","forearms","core"],["jump-rope"],"advanced","bodyweight-reps",["Jump higher than normal single-under.","Spin rope twice under feet per jump.","Use wrist rotation for speed.","Land softly."],["Common in CrossFit workouts.","Master singles first."]);
add("rope-climb","Rope Climb",["climbing rope"],"calisthenics","functional",["lats","biceps","grip"],["core","forearms","back"],["none"],"advanced","bodyweight-reps",["Grip rope, wrap feet for foot lock.","Pull up using arms and push with feet.","Climb to designated height.","Descend under control."],["Foot lock technique saves arm energy.","Legless rope climb is much harder."]);
add("handstand-walk","Handstand Walk",["HS walk","walking on hands"],"calisthenics","functional",["shoulders","core","triceps"],["forearms","full-body"],["none"],"advanced","duration",["Kick up to handstand.","Shift weight side to side walking on hands.","Take small controlled steps.","Maintain balance through fingertips."],["Requires solid freestanding handstand.","Practice against wall first."]);
add("assault-bike-calories","Assault Bike Calories",["air bike calories","bike calories"],"cardio","functional",["cardio-system","full-body"],["quads","shoulders","core"],["assault-bike"],"intermediate","calories-duration",["Sit on assault bike.","Push and pull arms while pedaling at max effort.","Chase calorie target.","Pace is key."],["Calorie target is common in CrossFit.","All-out effort is brutal."]);
add("rowing-calories","Rowing Calories",["row for calories","erg calories"],"cardio","functional",["cardio-system","back","lats"],["quads","core"],["rowing-machine"],"intermediate","calories-duration",["Sit on rower with feet strapped.","Drive with legs, lean back, pull arms.","Row at target pace for calorie goal.","Maintain form."],["Higher stroke rate with power for calories.","Legs are the primary driver."]);
add("ski-erg-calories","Ski Erg Calories",["ski calories"],"cardio","functional",["cardio-system","lats","core"],["triceps","shoulders"],["ski-erg"],"intermediate","calories-duration",["Stand at ski erg, grip handles.","Pull handles down using lats and core.","Hinge at hips for full power.","Chase calorie target."],["Pull through full range of motion.","Legs add power through the hip hinge."]);
add("sled-push-functional","Sled Push",["prowler push functional"],"strength","functional",["quads","glutes","cardio-system"],["calves","core"],["sled"],"intermediate","duration",["Load sled, grip handles.","Drive forward with powerful leg strides.","Low position for more power.","Sprint or pace as needed."],["No eccentric; easy recovery.","Vary handle height for different emphasis."]);
add("farmers-carry-functional","Farmers Carry",["farmer walk functional","heavy carry"],"strength","functional",["grip","forearms","traps","core"],["full-body"],["dumbbell","kettlebell"],"beginner","duration",["Pick up heavy implements.","Walk with upright posture.","Maintain grip and position.","Go for distance or time."],["Simple but brutally effective.","Challenges everything."]);
add("sandbag-clean","Sandbag Clean",["sandbag clean to shoulder"],"strength","functional",["full-body"],["quads","back","shoulders","core"],["none"],"intermediate","weight-reps",["Straddle sandbag on floor.","Hug and lift to lap.","Explosively clean to shoulder.","Drop and repeat."],["Awkward implement builds real-world strength.","Hug tight so it doesn't slide."]);
add("dball-over-shoulder","D-Ball Over Shoulder",["atlas stone over shoulder","stone over shoulder"],"strength","functional",["full-body","glutes","back"],["quads","shoulders","core"],["none"],"advanced","weight-reps",["Squat behind D-ball, bear hug it.","Lap the ball, then explosively extend.","Throw over one shoulder.","Walk around and repeat."],["Classic strongman-style exercise.","Round back is expected; brace core hard."]);

console.log('Functional: ' + exercises.length);

// ═══════════════════════════════════════════════════════════════════
// STRETCHING / MOBILITY
// ═══════════════════════════════════════════════════════════════════
add("foam-roll","Foam Roll",["foam rolling","SMR","self myofascial release"],"flexibility","stretching",["full-body"],["core"],["none"],"beginner","duration",["Place foam roller under target muscle.","Roll slowly along the muscle length.","Pause on tender spots for 20-30 seconds.","Move to next area."],["Don't roll directly on joints or spine.","Apply moderate pressure; painful but not excruciating."]);
add("lacrosse-ball","Lacrosse Ball",["lacrosse ball release","trigger point release"],"flexibility","stretching",["full-body"],["core"],["none"],"intermediate","duration",["Place lacrosse ball on tight spot against floor or wall.","Apply body weight pressure.","Hold on trigger points for 30-60 seconds.","Move to adjacent areas."],["More targeted than foam roller.","Great for glutes, pecs, and back."]);
add("worlds-greatest-stretch","World's Greatest Stretch",["WGS","greatest stretch"],"flexibility","stretching",["hip-flexors","hamstrings","core"],["adductors","shoulders","obliques"],["none"],"beginner","duration",["Step into deep lunge.","Place same-side hand on floor, rotate other arm up.","Drop elbow to instep, then reach up again.","Step forward and repeat other side."],["The single best dynamic stretch.","Hits almost every muscle group."]);
add("ninety-ninety-hip-stretch","90/90 Hip Stretch",["90 90 stretch","90/90 position"],"flexibility","stretching",["glutes","hip-flexors"],["adductors","abductors"],["none"],"beginner","duration",["Sit with one leg bent 90 degrees in front, other 90 behind.","Sit tall or fold over front shin.","Hold and breathe.","Switch sides."],["Great for hip internal and external rotation.","Use cushion under hips if needed."]);
add("couch-stretch","Couch Stretch",["rear foot elevated stretch","quad hip flexor stretch"],"flexibility","stretching",["hip-flexors","quads"],["core"],["none"],"intermediate","duration",["Kneel with back foot up against wall or couch.","Step front foot forward into lunge.","Drive hips forward for deep hip flexor stretch.","Keep torso upright."],["Addresses chronic hip flexor tightness from sitting.","Squeeze back glute for deeper stretch."]);
add("cat-cow","Cat-Cow",["cat cow stretch","spinal flexion extension"],"flexibility","stretching",["erector-spinae","lower-back"],["abs","core"],["yoga-mat"],"beginner","duration",["Start on all fours.","Inhale: arch back, lift head (cow).","Exhale: round back, tuck chin (cat).","Flow between positions."],["Classic spinal mobility exercise.","Move with breath."]);
add("thread-the-needle","Thread the Needle",["thoracic rotation stretch"],"flexibility","stretching",["upper-back","obliques"],["shoulders","core"],["yoga-mat"],"beginner","duration",["Start on all fours.","Thread one arm under body reaching to opposite side.","Lower shoulder toward floor.","Hold, then switch sides."],["Great thoracic spine rotation stretch.","Keep hips square."]);
add("doorway-chest-stretch","Doorway Chest Stretch",["pec stretch","chest stretch doorway"],"flexibility","stretching",["chest"],["front-delts","shoulders"],["none"],"beginner","duration",["Stand in doorway with arm at 90 degrees on frame.","Step through doorway leaning forward.","Feel stretch in chest and front shoulder.","Change arm height for different fibers."],["High arm = lower chest, low arm = upper chest.","Hold 30-60 seconds each side."]);
add("banded-shoulder-distraction","Banded Shoulder Distraction",["shoulder band stretch","shoulder distraction"],"flexibility","stretching",["shoulders","rotator-cuff"],["chest","lats"],["resistance-band"],"intermediate","duration",["Attach band overhead.","Loop around wrist or hand.","Step away and let band pull arm into various positions.","Hold each position 30-60 seconds."],["Provides gentle traction to the shoulder joint.","Move through different angles."]);
add("wall-slide","Wall Slide",["wall angel","wall slides"],"flexibility","stretching",["shoulders","rotator-cuff","upper-back"],["chest","traps"],["none"],"beginner","duration",["Stand with back against wall.","Place arms in goalpost position against wall.","Slide arms up and down keeping contact with wall.","Move slowly with control."],["Tests and improves shoulder mobility.","If any part loses wall contact, that's a mobility limitation."]);
add("ankle-dorsiflexion-stretch","Ankle Dorsiflexion Stretch",["calf wall stretch","ankle mobility"],"flexibility","stretching",["calves"],["hip-flexors"],["none"],"beginner","duration",["Stand facing wall with one foot forward.","Drive knee toward wall keeping heel on floor.","Measure by distance of toes from wall.","Switch feet."],["Limited ankle mobility affects squat depth.","Elevate toes on plate for variation."]);
add("scorpion-stretch","Scorpion Stretch",["prone scorpion","scorpion twist"],"flexibility","stretching",["hip-flexors","obliques","chest"],["lower-back","shoulders"],["yoga-mat"],"intermediate","duration",["Lie face down, arms extended to sides.","Kick one leg across body toward opposite hand.","Keep shoulders on floor.","Alternate sides."],["Opens hip flexors, chest, and spine.","Go only as far as comfortable."]);
add("standing-quad-stretch","Standing Quad Stretch",["quad stretch","quad pull"],"flexibility","stretching",["quads","hip-flexors"],["core"],["none"],"beginner","duration",["Stand on one leg, grab opposite foot behind you.","Pull heel toward glute.","Keep knees together.","Hold for 30-60 seconds, switch."],["Most common quad stretch.","Push hip forward for deeper stretch."]);
add("seated-ham-stretch","Seated Ham Stretch",["seated hamstring stretch","seated toe touch"],"flexibility","stretching",["hamstrings"],["lower-back","calves"],["none"],"beginner","duration",["Sit with legs extended.","Reach toward toes keeping back flat.","Hold at end range.","Breathe and relax into stretch."],["Don't round back; hinge at hips.","Use a strap if needed."]);
add("child-pose","Child's Pose",["childs pose","Balasana"],"flexibility","stretching",["lower-back","lats"],["shoulders","hip-flexors"],["yoga-mat"],"beginner","duration",["Kneel and sit back on heels.","Fold forward reaching arms ahead.","Rest forehead on floor.","Breathe deeply."],["Rest and recovery pose.","Knees together or wide for different stretches."]);
add("piriformis-stretch","Piriformis Stretch",["figure four stretch","piriformis release"],"flexibility","stretching",["glutes"],["hip-flexors","lower-back"],["yoga-mat"],"beginner","duration",["Lie on back, cross one ankle over opposite knee.","Pull bottom leg toward chest.","Feel stretch deep in the glute.","Hold 30-60 seconds, switch."],["Helps with sciatica symptoms.","Keep lower back on floor."]);
add("cross-body-shoulder-stretch","Cross-Body Shoulder Stretch",["cross body stretch","posterior delt stretch"],"flexibility","stretching",["rear-delts","shoulders"],["upper-back"],["none"],"beginner","duration",["Bring one arm across chest.","Use other arm to pull it closer.","Feel stretch in back of shoulder.","Hold 30 seconds, switch."],["Don't pull at the elbow joint.","Common and effective shoulder stretch."]);
add("behind-back-clasp","Behind-the-Back Clasp",["reverse prayer","shoulder clasp behind back"],"flexibility","stretching",["shoulders","chest"],["biceps","forearms"],["none"],"intermediate","duration",["Reach one arm overhead and other behind back.","Try to clasp hands behind your back.","Hold and breathe.","Switch arm positions."],["Use a strap to bridge the gap if needed.","Tests and improves shoulder flexibility."]);
add("wrist-circles","Wrist Circles",["wrist warm up","wrist mobility"],"flexibility","stretching",["forearms"],["grip"],["none"],"beginner","duration",["Extend arms in front.","Make circles with wrists in both directions.","Alternate clockwise and counterclockwise.","Do 10-15 circles each direction."],["Essential warm-up before pressing and pulling.","Add prayer stretch and reverse prayer."]);

console.log('Stretching: ' + exercises.length);
console.log('\\nTotal exercises: ' + exercises.length);

// Append to file
const serialized = exercises.map(e => JSON.stringify(e, null, 2)).join(',\n');
const existing = require('fs').readFileSync(OUTPUT, 'utf8');
// Remove trailing comma+newline and append new exercises plus closing bracket and helpers
const trimmed = existing.trimEnd();

const helpers = `
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function searchExercises(
  query: string,
  filters?: {
    category?: ExerciseCategory;
    muscleGroup?: MuscleGroup;
    equipment?: Equipment;
    difficulty?: string;
  }
): Exercise[] {
  const q = query.toLowerCase().trim();
  if (!q && !filters) return EXERCISES;

  let results = EXERCISES;

  // Apply filters first
  if (filters) {
    if (filters.category) {
      results = results.filter(e => e.category === filters.category);
    }
    if (filters.muscleGroup) {
      results = results.filter(e =>
        e.muscleGroups.primary.includes(filters.muscleGroup!) ||
        e.muscleGroups.secondary.includes(filters.muscleGroup!)
      );
    }
    if (filters.equipment) {
      results = results.filter(e => e.equipment.includes(filters.equipment!));
    }
    if (filters.difficulty) {
      results = results.filter(e => e.difficulty === filters.difficulty);
    }
  }

  if (!q) return results;

  // Score and sort by relevance
  const scored = results.map(exercise => {
    const name = exercise.name.toLowerCase();
    const aliasMatch = exercise.aliases.some(a => a.toLowerCase() === q);
    const aliasStartsWith = exercise.aliases.some(a => a.toLowerCase().startsWith(q));
    const aliasContains = exercise.aliases.some(a => a.toLowerCase().includes(q));

    let score = 0;
    if (name === q) score = 100;
    else if (aliasMatch) score = 95;
    else if (name.startsWith(q)) score = 80;
    else if (aliasStartsWith) score = 75;
    else if (name.includes(q)) score = 60;
    else if (aliasContains) score = 50;
    else {
      // Fuzzy: check if all query words appear somewhere
      const words = q.split(/\\s+/);
      const allText = (name + " " + exercise.aliases.join(" ") + " " + exercise.subcategory).toLowerCase();
      const allMatch = words.every(w => allText.includes(w));
      if (allMatch) score = 30;
    }

    return { exercise, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.exercise);
}

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find(e => e.id === id);
}

export function getExercisesByMuscle(muscle: MuscleGroup): Exercise[] {
  return EXERCISES.filter(
    e => e.muscleGroups.primary.includes(muscle) || e.muscleGroups.secondary.includes(muscle)
  );
}

export function getExercisesByEquipment(equip: Equipment): Exercise[] {
  return EXERCISES.filter(e => e.equipment.includes(equip));
}

export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  "chest": "Chest",
  "upper-chest": "Upper Chest",
  "lower-chest": "Lower Chest",
  "back": "Back",
  "lats": "Lats",
  "upper-back": "Upper Back",
  "traps": "Traps",
  "rhomboids": "Rhomboids",
  "erector-spinae": "Erector Spinae",
  "shoulders": "Shoulders",
  "front-delts": "Front Delts",
  "side-delts": "Side Delts",
  "rear-delts": "Rear Delts",
  "rotator-cuff": "Rotator Cuff",
  "biceps": "Biceps",
  "long-head-bicep": "Long Head Bicep",
  "short-head-bicep": "Short Head Bicep",
  "brachialis": "Brachialis",
  "triceps": "Triceps",
  "long-head-tricep": "Long Head Tricep",
  "lateral-head-tricep": "Lateral Head Tricep",
  "medial-head-tricep": "Medial Head Tricep",
  "forearms": "Forearms",
  "grip": "Grip",
  "quads": "Quads",
  "hamstrings": "Hamstrings",
  "glutes": "Glutes",
  "calves": "Calves",
  "hip-flexors": "Hip Flexors",
  "adductors": "Adductors",
  "abductors": "Abductors",
  "core": "Core",
  "abs": "Abs",
  "obliques": "Obliques",
  "transverse-abdominis": "Transverse Abdominis",
  "lower-back": "Lower Back",
  "full-body": "Full Body",
  "cardio-system": "Cardiovascular System",
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  "barbell": "Barbell",
  "dumbbell": "Dumbbell",
  "ez-bar": "EZ Bar",
  "trap-bar": "Trap Bar",
  "smith-machine": "Smith Machine",
  "cable-machine": "Cable Machine",
  "pulley": "Pulley",
  "resistance-band": "Resistance Band",
  "loop-band": "Loop Band",
  "kettlebell": "Kettlebell",
  "medicine-ball": "Medicine Ball",
  "slam-ball": "Slam Ball",
  "swiss-ball": "Swiss Ball",
  "bosu-ball": "BOSU Ball",
  "pull-up-bar": "Pull-Up Bar",
  "dip-station": "Dip Station",
  "roman-chair": "Roman Chair / GHD",
  "ab-roller": "Ab Roller",
  "flat-bench": "Flat Bench",
  "incline-bench": "Incline Bench",
  "decline-bench": "Decline Bench",
  "adjustable-bench": "Adjustable Bench",
  "squat-rack": "Squat Rack",
  "power-rack": "Power Rack",
  "leg-press": "Leg Press",
  "hack-squat": "Hack Squat Machine",
  "leg-extension": "Leg Extension Machine",
  "leg-curl": "Leg Curl Machine",
  "calf-raise-machine": "Calf Raise Machine",
  "chest-press-machine": "Chest Press Machine",
  "pec-deck": "Pec Deck / Fly Machine",
  "shoulder-press-machine": "Shoulder Press Machine",
  "lat-pulldown-machine": "Lat Pulldown Machine",
  "seated-row-machine": "Seated Row Machine",
  "cable-crossover": "Cable Crossover",
  "treadmill": "Treadmill",
  "elliptical": "Elliptical",
  "stair-climber": "StairMaster / Stair Climber",
  "stationary-bike": "Stationary Bike",
  "spin-bike": "Spin Bike",
  "rowing-machine": "Rowing Machine",
  "assault-bike": "Assault / Air Bike",
  "ski-erg": "Ski Erg",
  "versaclimber": "VersaClimber",
  "jump-rope": "Jump Rope",
  "box": "Plyo Box",
  "battle-ropes": "Battle Ropes",
  "sled": "Sled / Prowler",
  "tire": "Tire",
  "yoga-mat": "Yoga Mat",
  "yoga-blocks": "Yoga Blocks",
  "yoga-strap": "Yoga Strap",
  "yoga-wheel": "Yoga Wheel",
  "yoga-bolster": "Yoga Bolster",
  "pilates-reformer": "Pilates Reformer",
  "pilates-ring": "Pilates Ring",
  "pilates-ball": "Pilates Ball",
  "pilates-chair": "Pilates Chair",
  "trx": "TRX / Suspension Trainer",
  "gymnastic-rings": "Gymnastic Rings",
  "parallettes": "Parallettes",
  "heavy-bag": "Heavy Bag",
  "speed-bag": "Speed Bag",
  "boxing-gloves": "Boxing Gloves",
  "hand-wraps": "Hand Wraps",
  "none": "No Equipment (Bodyweight)",
};
`;

const output = trimmed + '\n' + serialized + '\n' + helpers;
fs.writeFileSync(OUTPUT, output, 'utf8');
console.log('\\nFinal file written: ' + (output.length / 1024).toFixed(0) + 'KB');
