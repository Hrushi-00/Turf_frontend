"use client";

import Link from "next/link";
import { useState } from "react";

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("1 Hour");

  const timeSlots = ["6:00 AM", "7:00 AM", "8:00 AM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"];
  const durations = ["1 Hour", "2 Hours", "3 Hours", "4 Hours"];

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-6 lg:px-16 pb-20 overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Bebas+Neue&display=swap');

        .glass{
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.08);
        }

        .cta-primary{
          background: #ffffff;
          color: #0B0B0B;
          transition:all .3s;
          box-shadow: 0 4px 12px rgba(255,255,255,.15);
        }
        .cta-primary:hover{
          background: #f0f0f0;
          box-shadow: 0 8px 20px rgba(255,255,255,.2);
          transform: translateY(-2px);
        }

        .time-slot{
          transition: all .2s;
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(255,255,255,.08);
        }
        .time-slot:hover{
          border-color: rgba(255,255,255,.4);
          background: rgba(255,255,255,.05);
        }
        .time-slot.selected{
          background: #ffffff;
          border-color: #ffffff;
          color: #0B0B0B;
          font-weight: bold;
        }
      `}</style>

      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-black to-black pointer-events-none"/>
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/3 blur-3xl pointer-events-none"/>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/2 blur-3xl pointer-events-none"/>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-5xl tracking-wide mb-2">Complete Your Booking</h1>
          <p className="text-gray-400">Selected: <span className="text-white font-bold">Arena Prime - Football</span></p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Date Selection */}
            <div className="glass p-8 rounded-xl">
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-2xl font-black mb-6">Select Date</h2>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 30 }).map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const formattedDate = date.toISOString().split('T')[0];
                  const day = date.getDate();
                  const dayName = date.toLocaleDateString('en', { weekday: 'short' });

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(formattedDate)}
                      className={`time-slot p-3 rounded-lg transition-all text-center ${
                        selectedDate === formattedDate
                          ? "selected"
                          : ""
                      }`}
                    >
                      <p className="text-xs text-gray-400 mb-1">{dayName}</p>
                      <p className="font-bold">{day}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            <div className="glass p-8 rounded-xl">
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-2xl font-black mb-6">Select Time Slot</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`time-slot px-4 py-3 rounded-lg transition-all ${
                      selectedTime === time
                        ? "selected"
                        : ""
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="glass p-8 rounded-xl">
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-2xl font-black mb-6">Select Duration</h2>
              <div className="grid grid-cols-4 gap-3">
                {durations.map(duration => (
                  <button
                    key={duration}
                    onClick={() => setSelectedDuration(duration)}
                    className={`time-slot px-4 py-3 rounded-lg transition-all ${
                      selectedDuration === duration
                        ? "selected"
                        : ""
                    }`}
                  >
                    {duration}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass p-8 rounded-xl sticky top-32">
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-2xl font-black mb-6">Summary</h3>

              <div className="space-y-4 pb-6 border-b border-gray-700">
                <div>
                  <p className="text-gray-400 text-sm">Turf</p>
                  <p className="font-black">Arena Prime</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Sport</p>
                  <p className="font-black text-white">Football</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Date</p>
                  <p className="font-black text-sm">{selectedDate || "Select date"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Time</p>
                  <p className="font-black text-sm">{selectedTime || "Select time"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Duration</p>
                  <p className="font-black text-sm">{selectedDuration}</p>
                </div>
              </div>

              <div className="py-6 space-y-3 border-b border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">Turf Price</span>
                  <span className="font-bold">₹800</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration</span>
                  <span className="font-bold">{selectedDuration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax (18%)</span>
                  <span className="font-bold">₹144</span>
                </div>
              </div>

              <div className="py-6">
                <div className="flex justify-between items-center">
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-lg font-black">Total</span>
                  <span className="text-2xl font-black text-white">₹944</span>
                </div>
              </div>

              <div className="space-y-3">
                <button className="cta-primary w-full py-3 rounded-lg font-black text-lg">
                  PROCEED TO PAYMENT
                </button>
                <Link href="/" className="block text-center px-4 py-3 border border-gray-700 rounded-lg font-bold hover:border-gray-600 transition-all">
                  Cancel
                </Link>
              </div>

              <p className="text-xs text-gray-500 text-center mt-6">Cancellation allowed up to 2 hours before booking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
