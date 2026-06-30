import React from "react";

export default function BrainProgress({ days = 0 }) {

  const progress = Math.min(days / 365, 1);

  const fillY = 220 - (220 * progress);

  return (
    <div className="relative w-64 h-64">

      <svg
        viewBox="0 0 220 220"
        className="w-full h-full"
      >

        <defs>

          {/* Controls pink reveal */}
          <clipPath id="brainReveal">

            <rect
              x="0"
              y={fillY}
              width="220"
              height="220"
            />

          </clipPath>


          {/* Brain shape */}
          <path
            id="brainShape"
            d="
            M110 25
            C80 18 48 32 38 58
            C20 60 15 82 28 98
            C12 120 25 150 52 154
            C60 180 86 190 110 176
            C134 190 160 180 168 154
            C195 150 208 120 192 98
            C205 82 200 60 182 58
            C172 32 140 18 110 25
            Z
            "
          />

          <clipPath id="brainClip">
            <use href="#brainShape"/>
          </clipPath>

        </defs>



        {/* BLACK BRAIN */}

        <use
          href="#brainShape"
          fill="#050505"
        />



        {/* PINK RESTORATION */}

        <rect
          x="0"
          y={fillY}
          width="220"
          height="220"
          fill="#ff4fa3"
          clipPath="url(#brainClip)"
          style={{
            transition:
            "all 1s ease"
          }}
        />



        {/* BRAIN FOLDS */}

        <g
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="2"
          strokeLinecap="round"
        >


          {/* Left hemisphere */}

          <path d="
          M95 45
          C70 35 55 55 70 72
          C82 85 55 95 68 112
          C78 125 90 120 96 110
          "/>


          <path d="
          M72 55
          C55 70 75 82 60 100
          "/>


          <path d="
          M80 118
          C55 130 70 150 92 145
          "/>


          <path d="
          M48 85
          C60 88 65 105 50 115
          "/>



          {/* Right hemisphere */}

          <path d="
          M125 45
          C150 35 165 55 150 72
          C138 85 165 95 152 112
          C142 125 130 120 124 110
          "/>


          <path d="
          M148 55
          C165 70 145 82 160 100
          "/>


          <path d="
          M140 118
          C165 130 150 150 128 145
          "/>


          <path d="
          M172 85
          C160 88 155 105 170 115
          "/>




          {/* Central brain groove */}

          <path
          d="
          M110 32
          C104 60
          116 85
          110 110
          C104 140
          116 160
          110 178
          "
          />




          {/* Extra folds */}

          <path d="
          M90 65
          C100 75 92 90 100 100
          "/>


          <path d="
          M130 65
          C120 75 128 90 120 100
          "/>


          <path d="
          M90 135
          C105 125 115 125 130 135
          "/>


        </g>



        {/* Outer brain edge */}

        <use
          href="#brainShape"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
        />


      </svg>



      <div className="
      absolute
      bottom-2
      left-0
      right-0
      text-center
      text-sm
      text-white
      ">
        {days}/365 days
      </div>


    </div>
  );
}