import { Command } from "@sapphire/framework";
import axios, { AxiosError, AxiosResponse } from 'axios';
import * as json from '../config.json'
import { Role } from "discord.js";

export class VerifyCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, { ...options, description: "Verify a User", });
  }
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => {
      builder.setName("giveroles").setDescription("Assign roles for channel access");
    });
  }
  
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await interaction.deferReply();
    let config: IStringIndex = json;
    const uid = interaction.user.id;
    let res: AxiosResponse = {} as AxiosResponse;
    let data: ApiResponse;
    try {
      res = await axios.get(`https://api.vatsim.net/v2/members/discord/${uid}`);
      data = res.data;
    } catch (e) {
      let error = e as AxiosError;
      if (error.response?.status == 404) {
        await handleError(1, interaction);
      }
      return;
    }
    
    if (data.id != uid) {
      await handleError(2, interaction);
      return;
    }

    res = await axios.get(`https://api.vatusa.net/v2/user/${data.user_id}`);
    if (res.status == 404) {
      await handleError(2, interaction);
      return;
    }

    let user: User = {
      fname: res.data.data.fname,
      lname: res.data.data.lname,
      artcc: res.data.data.facility,
      rating: res.data.data.rating.toString(),
      roles: res.data.data.roles,
      visiting_facilities: res.data.data.visiting_facilities
    }
    
    let member = await interaction.guild?.members.fetch(uid);
    await member.roles.add('475759174249349123'); //VATSIMController role
    if (member != null) {
      switch (user.rating) {
        case "1": {
          user.rating = "OBS";
          break;
        }
        case "2": {
          user.rating = "S1";
          break;
        }
        case "3": {
          user.rating = "S2";
          break;
        }
        case "4": {
          user.rating = "S3";
          break;
        }
        case "5": {
          user.rating = "C1";
          break;
        }
        case "7": {
          user.rating = "C3";
          break;
        }
        case "8": {
          user.rating = "I1";
          break;
        }
        case "10": {
          user.rating = "I3";
          break;
        }
        case "11": {
          user.rating = "SUP";
          break;
        }
        case "12": {
          user.rating = "ADM";
          break;
        }
        default: {
          user.rating = "";
          break;
        }
      }
      console.log(user);
      try {
        await member.setNickname(`${user.fname} ${user.lname} | ${user.artcc}`);
        let rating = config[user.rating];
        let role = await interaction.guild?.roles.fetch(rating);
        await member?.roles.add(role!);
        if (user.artcc != "ZJX") {
          for (let i = 0; i < user.visiting_facilities.length; i++) {
            if (user.visiting_facilities[i].facility == "ZJX") {
              role = await interaction.guild?.roles.fetch(config.visitor);
            } else {
              break;
            }
          }
        } else {
          role = await interaction.guild?.roles.fetch(config.member);
        }
        await member?.roles.add(role!);
      } catch (error) {
        await handleError(0, interaction);
        console.log(`Line 115: ${error}`);
        return;
      }
    }
    console.log(user.roles.length);
    if (user.roles.length > 0) {
      for (let i = 0; i < user.roles.length; i++) {
        if (user.roles[i].facility == "ZAE") {
          break;
        } 
        let role: Role | undefined | null;
        if (user.roles[i].facility != "ZJX") {
          break;
        }
        switch(user.roles[i].role) {
          case "ATM": 
            role = await interaction.guild?.roles.fetch(config.atm);
            await member?.roles.add(role!);
            break;
          case "DATM": 
            role = await interaction.guild?.roles.fetch(config.datm);
            await member?.roles.add(role!);
            break;
          case "TA":
            role = await interaction.guild?.roles.fetch(config.ta);
            await member?.roles.add(role!);
            break;
          case "FE": 
            role = await interaction.guild?.roles.fetch(config.fe);
            await member?.roles.add(role!);
            break;
          case "EC":
            role = await interaction.guild?.roles.fetch(config.ec);
            await member?.roles.add(role!);
            break;
          case "WM":
            role = await interaction.guild?.roles.fetch(config.wm);
            await member?.roles.add(role!);
            break;
        }
      }
    }
    
    await interaction.editReply("Your roles have been assigned!");
    return;
  }
}

async function handleError(error: number, interaction: Command.ChatInputCommandInteraction) {
  let errorText: string;
  
  switch (error) {
    case 0: {
      errorText = `There was an error assigning roles for ${interaction.user.username}`;
      await interaction.editReply("There was an error assigning your roles!");
      sendError(errorText, interaction);
      break;
    }
    case 1: {
      errorText = "You are not linked to a VATSIM account! Please link your account at https://community.vatsim.net/ then try again!"
      await interaction.editReply(errorText);
      break;
    }
    case 2: {
      errorText = "You were not found in the VATUSA database! You have been issued the pilot role"
      await interaction.editReply(errorText);
      break;
    }
    case 3: {
      errorText = "Something went wrong, please try again!"
      await interaction.editReply(errorText);
      await sendError("Some error occured while verifying a user", interaction);
      break;
    }
  }
  return;
}

async function sendError(errorText: string, interaction: Command.ChatInputCommandInteraction) {
  let errorDate = new Date();
  let errorStamp = errorDate.toLocaleDateString() + " " + errorDate.toLocaleTimeString();
  console.log(errorText);
  await interaction.editReply(errorText + " \n**The developers have been notified of this error.**")
  await interaction.client.users.send("312974144574717952",`${errorStamp} Zulu: ${errorText}`)
  return;
}

interface ApiResponse {
  id: string;
  user_id: string;
}

interface User {
  fname: string;
  lname: string;
  artcc: string;
  rating: string;
  roles: [
    {
      id: number;
      cid: number;
      facility: string;
      role: string;
      created_at: string;
    }
  ]
  visiting_facilities: [
    {
      id: number;
      cid: number;
      facility: string;
      created_at: string;
      updated_at: string;
    }
  ]
}

interface IStringIndex {
  [key: string]: any;
}